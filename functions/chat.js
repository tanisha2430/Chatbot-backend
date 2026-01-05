const dotenv = require("dotenv");
const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

dotenv.config();

console.log("API KEY EXISTS:", !!process.env.OPENAI_API_KEY);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Load fintech context
const companyData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "fintech_docs.json"), "utf8")
);

function flattenContext(obj, parentKey = "") {
  let result = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = parentKey ? `${parentKey}.${key}` : key;
    if (typeof value === "object" && value !== null) {
      result = result.concat(flattenContext(value, fullKey));
    } else {
      result.push(`${fullKey}: ${value}`);
    }
  }
  return result;
}

const companyContext = flattenContext(companyData).join("\n");

// CSV paths
const paymentsPath = path.join(__dirname, "../data/payments.csv");
const cardPaymentsPath = path.join(__dirname, "../data/card_payments.csv");

// Track users pending for order ID input
const pendingFraudMap = {};

module.exports.chatHandler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const userId = body.userId || body.sessionId || "default";
    const userQuery = body.message.trim();

    // If already pending and asks fraud again
    if (pendingFraudMap[userId] && isSuspiciousQuery(userQuery)) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          answer:
            "You've already raised a complaint. Please provide the **Order ID** to proceed.",
        }),
      };
    }

    // Handle follow-up for order ID
    if (pendingFraudMap[userId]) {
      const orderId = extractOrderId(userQuery);
      if (!orderId) {
        return {
          statusCode: 200,
          body: JSON.stringify({
            answer: "Please provide a valid Order ID to continue.",
          }),
        };
      }

      const orderDetails = await lookupOrder(orderId);
      delete pendingFraudMap[userId];

      if (!orderDetails) {
        return {
          statusCode: 200,
          body: JSON.stringify({
            answer: `I couldn't find any details for Order ID: ${orderId}. Please double-check.`,
          }),
        };
      }

      const response = formatOrderResponse(orderDetails);
      return {
        statusCode: 200,
        body: JSON.stringify({ answer: response }),
      };
    }

    // Detect fraud-related keywords
    if (isSuspiciousQuery(userQuery)) {
      pendingFraudMap[userId] = true;
      return {
        statusCode: 200,
        body: JSON.stringify({
          answer:
            "I'm sorry to hear that. Could you please share your **Order ID** so I can look into the transaction for you?",
        }),
      };
    }

    // Fallback to OpenAI assistant
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a helpful fintech support assistant. Use the context below when answering:\n\n${companyContext}`,
        },
        {
          role: 'user',
          content: userQuery,
        },
      ],
    });
    const answer =
      completion?.choices?.[0]?.message?.content ??
      "Sorry, I couldn’t generate a response at the moment.";

    return {
      statusCode: 200,
      body: JSON.stringify({
        answer
      }),
    };
  } catch (err) {
    console.error("❌ Error:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Something went wrong. " + err.message }),
    };
  }
};

// ------------------ Helpers ------------------

function isSuspiciousQuery(text) {
  const keywords = [
    "fraud",
    "unauthorized",
    "wrong charge",
    "deducted",
    "money gone",
    "chargeback",
    "dispute",
  ];
  return keywords.some((kw) => text.toLowerCase().includes(kw));
}

function extractOrderId(text) {
  const match = text.match(/\d{6,}/);
  return match ? match[0] : null;
}

async function lookupOrder(orderId) {
  const payments = await findInCSV(paymentsPath, "order_ref", orderId);
  if (payments) return { ...payments, source: "payments" };

  const cardPayments = await findInCSV(cardPaymentsPath, "order_id", orderId);
  if (cardPayments) return { ...cardPayments, source: "card" };

  return null;
}

function findInCSV(filePath, key, valueToMatch) {
  return new Promise((resolve, reject) => {
    let foundRow = null;
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        if (row[key] === valueToMatch) {
          foundRow = row;
        }
      })
      .on("end", () => resolve(foundRow))
      .on("error", reject);
  });
}

function formatOrderResponse(order) {
  const id = order.order_ref || order.order_id;
  const date = order.transaction_time || order.time;
  const gross = order.gross || order.total;
  const fee = order.fee || order.fees || "N/A";
  const net = order.net || order.payed || "N/A";
  const source = order.source === "card" ? "card_payments" : "payments";

  return {
    type: "transaction_found",
    orderId: id,
    date,
    gross,
    fee,
    net,
    source,
  };
}

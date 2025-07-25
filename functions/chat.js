// const dotenv = require('dotenv');
// const OpenAI = require('openai');

// dotenv.config()

// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })


// console.log("🔑 OPENAI_API_KEY in runtime:", openai);


// module.exports.chatHandler = async (event) => {
//   try {
//     const body = JSON.parse(event.body)
//     const userQuery = body.message

//     const completion = await openai.chat.completions.create({
//       model: 'gpt-4o-mini',
//       messages: [
//         {
//           role: 'system',
//           content:
//             'You are a helpful fintech support assistant who answers questions about payments, onboarding, and KYC.',
//         },
//         {
//           role: 'user',
//           content: userQuery,
//         },
//       ],
//     })

//     return {
//       statusCode: 200,
//       body: JSON.stringify({
//         answer: completion.choices[0].message.content,
//       }),
//     }
//   } catch (err) {
//     console.error('❌ OpenAI Error:', err.message)
//     return {
//       statusCode: 500,
//       body: JSON.stringify({
//         error: 'Something went wrong. ' + err.message,
//       }),
//     }
//   }
// }











// const dotenv = require('dotenv');
// const OpenAI = require('openai');
// const fs = require('fs');
// const cosineSimilarity = require('cosine-similarity');

// dotenv.config();

// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// console.log('🔑 OPENAI_API_KEY in runtime:', openai);

// let embeddedDocs = [];

// async function loadAndEmbedDocsOnce() {
//   if (embeddedDocs.length > 0) return;

//   const fintechDocs = JSON.parse(
//     fs.readFileSync('/Users/tanisha/Documents/spark/Chatbot/backend/fintech_docs.json', 'utf8')
//   );

//   const texts = fintechDocs.map((doc) => doc.text);

//   const embeddingsRes = await openai.embeddings.create({
//     model: 'text-embedding-3-small',
//     input: texts,
//   });
//       console.log("🔹 Embedding result sample:", embeddingsRes.data[0]);


//   embeddedDocs = fintechDocs.map((doc, idx) => ({
//     ...doc,
//     embedding: embeddingsRes.data[idx].embedding,

//   }));
// }



// function getTopMatches(queryEmbedding, topK = 3) {
//   return embeddedDocs
//     .map((doc) => ({
//       ...doc,
//       score: cosineSimilarity(queryEmbedding, doc.embedding),
//     }))
//     .sort((a, b) => b.score - a.score)
//     .slice(0, topK);
// }

// module.exports.chatHandler = async (event) => {
//   try {
//     const body = JSON.parse(event.body);
//     const userQuery = body.message;

//     await loadAndEmbedDocsOnce();

//     // 1. Embed the user query
//     const embedRes = await openai.embeddings.create({
//       model: 'text-embedding-3-small',
//       input: userQuery,
//     });

//     const queryEmbedding = embedRes.data[0].embedding;

//     // 2. Get top relevant context
//     const topDocs = getTopMatches(queryEmbedding);
//     const contextText = topDocs.map((d) => d.text).join('\n');

//     // 3. Send to ChatGPT with context
//     const completion = await openai.chat.completions.create({
//       model: 'gpt-4o-mini',
//       messages: [
//         {
//           role: 'system',
//           content:
//             'You are a helpful fintech support assistant who answers questions about payments, onboarding, and KYC. Use the following context from fintech docs to answer.',
//         },
//         {
//           role: 'user',
//           content: `Context:\n${contextText}\n\nQuestion: ${userQuery}`,
//         },
//       ],
//     });

//     return {
//       statusCode: 200,
//       body: JSON.stringify({
//         answer: completion.choices[0].message.content,
//       }),
//     };
//   } catch (err) {
//     console.error('❌ OpenAI Error:', err.message);
//     return {
//       statusCode: 500,
//       body: JSON.stringify({
//         error: 'Something went wrong. ' + err.message,
//       }),
//     };
//   }
// };



















// final working api + json


// const dotenv = require('dotenv');
// const OpenAI = require('openai');
// const fs = require('fs');
// const path = require('path');

// dotenv.config();

// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// // Read company info JSON once
// const companyData = JSON.parse(fs.readFileSync(path.join(__dirname, 'fintech_docs.json'), 'utf8'));

// // Convert it to a formatted string
// const companyContext = Object.entries(companyData)
//   .map(([topic, answer]) => `- ${topic}: ${answer}`)
//   .join('\n');

// module.exports.chatHandler = async (event) => {
//   try {
//     const body = JSON.parse(event.body);
//     const userQuery = body.message;

//     const completion = await openai.chat.completions.create({
//       model: 'gpt-4o-mini',
//       messages: [
//         {
//           role: 'system',
//           content: `You are a helpful fintech support assistant. Answer based on the company-specific info below when relevant. If unsure, fall back to general knowledge.\n\nCompany Info:\n${companyContext}`,
//         },
//         {
//           role: 'user',
//           content: userQuery,
//         },
//       ],
//     });

//     return {
//       statusCode: 200,
//       body: JSON.stringify({
//         answer: completion.choices[0].message.content,
//       }),
//     };
//   } catch (err) {
//     console.error('❌ OpenAI Error:', err.message);
//     return {
//       statusCode: 500,
//       body: JSON.stringify({
//         error: 'Something went wrong. ' + err.message,
//       }),
//     };
//   }
// };









const dotenv = require('dotenv');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Load Fintech Context
// const companyData = JSON.parse(fs.readFileSync(path.join(__dirname, 'fintech_docs.json'), 'utf8'));
// const companyContext = Object.entries(companyData)
//   .map(([topic, answer]) => `- ${topic}: ${answer}`)
//   .join('\n');
const companyData = JSON.parse(fs.readFileSync(path.join(__dirname, 'fintech_docs.json'), 'utf8'));

function flattenContext(obj, parentKey = '') {
  let result = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = parentKey ? `${parentKey}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      result = result.concat(flattenContext(value, fullKey));
    } else {
      result.push(`${fullKey}: ${value}`);
    }
  }
  return result;
}

const companyContext = flattenContext(companyData).join('\n');


// CSV file paths
const paymentsPath = path.join(__dirname, '../data/payments.csv');
const cardPaymentsPath = path.join(__dirname, '../data/card_payments.csv');

// Track users pending for order ID input
const pendingFraudMap = {};

module.exports.chatHandler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const userId = body.userId || body.sessionId || 'default';
    const userQuery = body.message.trim();

    // Handle follow-up for order ID
    if (pendingFraudMap[userId]) {
      const orderId = extractOrderId(userQuery);
      if (!orderId) {
        return {
          statusCode: 200,
          body: JSON.stringify({ answer: "Please provide a valid Order ID to continue." }),
        };
      }

      const orderDetails = await lookupOrder(orderId);
      delete pendingFraudMap[userId];

      if (!orderDetails) {
        return {
          statusCode: 200,
          body: JSON.stringify({ answer: `I couldn't find any details for Order ID: ${orderId}. Please double-check.` }),
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
          answer: "I'm sorry to hear that. Could you please share your **Order ID** so I can look into the transaction for you?",
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

    return {
      statusCode: 200,
      body: JSON.stringify({ answer: completion.choices[0].message.content }),
    };
  } catch (err) {
    console.error('❌ Error:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Something went wrong. ' + err.message }),
    };
  }
};

// ------------------ Helpers ------------------

function isSuspiciousQuery(text) {
  const keywords = ['fraud', 'unauthorized', 'wrong charge', 'deducted', 'money gone', 'chargeback', 'dispute'];
  return keywords.some((kw) => text.toLowerCase().includes(kw));
}

function extractOrderId(text) {
  const match = text.match(/\d{6,}/);
  return match ? match[0] : null;
}

async function lookupOrder(orderId) {
  const payments = await findInCSV(paymentsPath, 'order_ref', orderId);
  if (payments) return { ...payments, source: 'payments' };

  const cardPayments = await findInCSV(cardPaymentsPath, 'order_id', orderId);
  if (cardPayments) return { ...cardPayments, source: 'card' };

  return null;
}

function findInCSV(filePath, key, valueToMatch) {
  return new Promise((resolve, reject) => {
    let foundRow = null;
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        if (row[key] === valueToMatch) {
          foundRow = row;
        }
      })
      .on('end', () => resolve(foundRow))
      .on('error', reject);
  });
}

// function formatOrderResponse(order) {
//   const id = order.order_ref || order.order_id;
//   const date = order.transaction_time || order.time;
//   const gross = order.gross || order.total;
//   const fee = order.fee || order.fees || 'N/A';
//   const net = order.net || order.payed || 'N/A';
//   const source = order.source === 'card' ? 'card_payments' : 'payments';

//   return `✅ Found transaction from **${source}** for Order ID **${id}**:
// • Date: ${date}
// • Gross: ${gross}
// • Fee: ${fee}
// • Net: ${net}

// If you believe this was unauthorized or incorrect, we recommend contacting support to investigate.`;
// }



function formatOrderResponse(order) {
  const id = order.order_ref || order.order_id;
  const date = order.transaction_time || order.time;
  const gross = order.gross || order.total;
  const fee = order.fee || order.fees || 'N/A';
  const net = order.net || order.payed || 'N/A';
  const source = order.source === 'card' ? 'card_payments' : 'payments';

  return {
    type: 'transaction_found',
    orderId: id,
    date,
    gross,
    fee,
    net,
    source,
  };
}

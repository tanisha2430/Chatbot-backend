async function lookupOrderDetails(orderId) {
  const [payment] = await db.query("SELECT * FROM payments WHERE order_ref = ?", [orderId]);
  if (payment) return payment;

  const [card] = await db.query("SELECT * FROM card_payments WHERE order_id = ?", [orderId]);
  if (card) return card;

  return null;
}

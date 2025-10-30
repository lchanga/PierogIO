const { TaxAPI } = require('../apis/tax-api');

/**
 * Calculate tax for an order
  * 
 * @param {Object} order - The order object with items array
 * @param {Object} delivery - Delivery information
 * @returns {number} - Tax amount in cents
 */
function tax(order, delivery, deliveryFeeCents = 0) {
  // Determine if the order contains any hot items
  let hasHotItems = false;
  let totalTax = 0;

  for (const item of order.items) {
    const itemTotal = item.unitPriceCents * item.qty;

    if (item.kind === 'hot') {
      hasHotItems = true;
      const taxRateBps = TaxAPI.lookup('hot'); // basis points (e.g. 800 = 8%)
      const taxRate = taxRateBps / 10000;
      const itemTax = Math.floor(itemTotal * taxRate);
      totalTax += itemTax;
    }
    // Frozen items are tax-exempt per policy; skip them
  }

  // Delivery fee is taxable only when the order contains any hot items
  if (hasHotItems && deliveryFeeCents > 0) {
    const hotTaxRateBps = TaxAPI.lookup('hot');
    const hotTaxRate = hotTaxRateBps / 10000;
    totalTax += Math.floor(deliveryFeeCents * hotTaxRate);
  }

  return totalTax;
}

module.exports = { tax };

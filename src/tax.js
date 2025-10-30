const { TaxAPI } = require('../apis/tax-api');

/**
 * Calculate tax for an order
  * 
 * @param {Object} order - The order object with items array
 * @param {Object} delivery - Delivery information
 * @param {number} deliveryFeeAmount - Delivery fee in cents
 * @returns {number} - Tax amount in cents
 */
function tax(order, delivery, deliveryFeeAmount = 0) {
  let hasHotItems = false;
  let totalTax = 0;

  for (const item of order.items) {
    const itemTotal = item.unitPriceCents * item.qty;

    if (item.kind === 'hot') {
      hasHotItems = true;
      const taxRateBasisPoints = TaxAPI.lookup(item.kind);
      const itemTax = Math.floor(itemTotal * taxRateBasisPoints / 10000);
      totalTax += itemTax;
    }
  }

  // Tax delivery if there are hot items
  if (hasHotItems && deliveryFeeAmount > 0) {
    const taxRateBasisPoints = TaxAPI.lookup('hot');
    totalTax += Math.floor(deliveryFeeAmount * taxRateBasisPoints / 10000);
  }

  return totalTax;
}

module.exports = { tax };

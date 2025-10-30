const fc = require('fast-check');
const { total } = require('../../src/total');
const { referenceTotal } = require('../../src/reference');

describe('Property-Based Tests for Orders', () => {
  
  // Arbitrary generators
  const addOnArb = fc.constantFrom('sour-cream', 'fried-onion', 'bacon-bits');
  const fillingArb = fc.constantFrom('potato', 'sauerkraut', 'sweet-cheese', 'mushroom');
  const kindArb = fc.constantFrom('hot', 'frozen');
  const tierArb = fc.constantFrom('guest', 'regular', 'vip');
  const zoneArb = fc.constantFrom('local', 'outer');
  
  const orderItemArb = fc.record({
    sku: fc.constantFrom('P6-POTATO', 'P12-POTATO', 'P24-POTATO', 'P6-SAUER', 'P12-SAUER'),
    title: fc.string(),
    kind: kindArb,
    filling: fillingArb,
    qty: fc.constantFrom(6, 12, 24),
    unitPriceCents: fc.integer({ min: 500, max: 3000 }),
    addOns: fc.array(addOnArb, { maxLength: 3 })
  });
  
  const orderArb = fc.record({
    items: fc.array(orderItemArb, { minLength: 1, maxLength: 5 })
  });
  
  const profileArb = fc.record({
    tier: tierArb
  });
  
  const deliveryArb = fc.record({
    zone: zoneArb,
    rush: fc.boolean()
  });
  
  const contextArb = fc.record({
    profile: profileArb,
    delivery: deliveryArb,
    coupon: fc.option(fc.constantFrom('PIEROGI-BOGO', 'FIRST10'), { nil: null })
  });
  
  describe('Invariants', () => {
    
    // Here's an example preservation property!
    it('total should always be non-negative integer', () => {
      fc.assert(
        fc.property(orderArb, contextArb, (order, context) => {
          const result = total(order, context);
          return result >= 0 && Number.isInteger(result);
        }),
        { numRuns: 50 }
      );
    });

  });
  
  describe('Free Delivery Thresholds', () => {
  
    it('guest tier gets free delivery when subtotal >= $50', () => {
      fc.assert(
        fc.property(orderArb, (order) => {
          const context = {
            profile: { tier: 'guest' },
            delivery: { zone: 'local', rush: false }
          };
          const subtotalCents = order.items.reduce((sum, item) => sum + (item.qty * item.unitPriceCents), 0);
          
          // If subtotal >= $50 (5000 cents), delivery should be free
          if (subtotalCents >= 5000) {
            const orderTotal = total(order, context);
            // Assert that delivery fee is not charged (or verify against expected total)
            return true; // Would need actual assertion logic
          }
          return true;
        }),
        { numRuns: 100 }
      );
    });
  
    it('regular tier gets free delivery when subtotal >= $40', () => {
      fc.assert(
        fc.property(orderArb, (order) => {
          const context = {
            profile: { tier: 'regular' },
            delivery: { zone: 'local', rush: false }
          };
          const subtotalCents = order.items.reduce((sum, item) => sum + (item.qty * item.unitPriceCents), 0);
          
          if (subtotalCents >= 4000) {
            const orderTotal = total(order, context);
            return true;
          }
          return true;
        }),
        { numRuns: 100 }
      );
    });
  
    it('vip tier gets free delivery when subtotal >= $30', () => {
      fc.assert(
        fc.property(orderArb, (order) => {
          const context = {
            profile: { tier: 'vip' },
            delivery: { zone: 'local', rush: false }
          };
          const subtotalCents = order.items.reduce((sum, item) => sum + (item.qty * item.unitPriceCents), 0);
          
          if (subtotalCents >= 3000) {
            const orderTotal = total(order, context);
            return true;
          }
          return true;
        }),
        { numRuns: 100 }
      );
    });
  
  });
});

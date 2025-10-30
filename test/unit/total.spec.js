const { total } = require('../../src/total');
const { subtotal } = require('../../src/subtotal');
const { discounts } = require('../../src/discounts');
const { deliveryFee } = require('../../src/delivery');
const { tax } = require('../../src/tax');

describe('Order Calculations', () => {
  
  describe('total', () => {
    it('should calculate complete order total', () => {
      const order = {
        items: [
          {
            sku: 'P6-POTATO', // could be any valid SKU (see README.md for examples)
            title: '6-pack Potato',
            kind: 'hot', // could be 'hot' or 'frozen'
            filling: 'potato', // could be 'potato', 'cheese', 'meat', etc.
            qty: 6, // quantity of this item
            unitPriceCents: 699, // price per unit in cents
            addOns: [], // could include 'sour-cream', 'fried-onion', 'bacon-bits'
          }
        ]
      };
      
      const context = {
        profile: { tier: 'guest' }, // could be 'guest', 'regular', or 'vip'
        delivery: {
          zone: 'local', // could be 'local' or 'outer'
          rush: false, // boolean indicating rush delivery
        },
        // coupon is optional and omitted here
      };
      
      const orderTotal = total(order, context);
      expect(orderTotal).toBeGreaterThan(0);
      expect(Number.isInteger(orderTotal)).toBe(true);
    });

    it('should apply tax on hot items but not frozen items', () => {
      // Test with HOT items only
      const hotOrder = {
        items: [
          {
            sku: 'P6-POTATO',
            title: '6-pack Potato',
            kind: 'hot',
            filling: 'potato',
            qty: 1,
            unitPriceCents: 1000, // $10.00
            addOns: []
          }
        ]
      };
      
      const context = {
        profile: { tier: 'guest' },
        delivery: { zone: 'local', rush: false }
      };
      
      const hotOrderTotal = total(hotOrder, context);
      
      // Test with FROZEN items only
      const frozenOrder = {
        items: [
          {
            sku: 'P6-POTATO',
            title: '6-pack Potato',
            kind: 'frozen',
            filling: 'potato',
            qty: 1,
            unitPriceCents: 1000, // $10.00
            addOns: []
          }
        ]
      };
      
      const frozenOrderTotal = total(frozenOrder, context);
      
      // Hot items should be taxed more than frozen items
      // (Hot gets 8% tax on items + delivery, frozen gets 0% tax)
      expect(hotOrderTotal).toBeGreaterThan(frozenOrderTotal);
    });
  });

  describe('Delivery Fee Logic', () => {
  
    it('should apply base delivery fee for local zone', () => {
      const order = {
        items: [{ sku: 'P6-POTATO', title: '6-pack Potato', kind: 'hot', filling: 'potato', qty: 1, unitPriceCents: 699, addOns: [] }]
      };
      const context = {
        profile: { tier: 'guest' },
        delivery: { zone: 'local', rush: false }
      };
      
      const orderTotal = total(order, context);
      // Subtotal: $6.99, with tax 8%: ~$7.55, plus delivery fee should be included
      const subtotal = 699;
      const withTax = Math.round(subtotal * 1.08);
      expect(orderTotal).toBeGreaterThan(withTax); // Should include delivery fee
    });
  
    it('should waive delivery fee when discounted subtotal meets threshold (guest >= $50)', () => {
      const order = {
        items: [{ sku: 'P24-POTATO', title: '24-pack Potato', kind: 'hot', filling: 'potato', qty: 3, unitPriceCents: 2399, addOns: [] }]
      };
      const context = {
        profile: { tier: 'guest' },
        delivery: { zone: 'local', rush: false }
      };
      
      const orderTotal = total(order, context);
      // Should NOT include delivery fee
      const expectedWithoutDelivery = order.items.reduce((sum, item) => sum + (item.qty * item.unitPriceCents), 0);
      expect(orderTotal).toBeLessThanOrEqual(expectedWithoutDelivery * 1.15); // With tax, but no delivery
    });
  
    it('should add $2.99 rush fee to delivery', () => {
      const order = {
        items: [{ sku: 'P6-POTATO', title: '6-pack Potato', kind: 'hot', filling: 'potato', qty: 1, unitPriceCents: 699, addOns: [] }]
      };
      const context = {
        profile: { tier: 'guest' },
        delivery: { zone: 'local', rush: true }
      };
      
      const orderTotalWithRush = total(order, context);
      // Should be higher than without rush
      context.delivery.rush = false;
      const orderTotalNoRush = total(order, context);
      
      // Rush fee is $2.99 (299 cents), and appears to be getting taxed at 8% for hot items
      const rushFeeDifference = orderTotalWithRush - orderTotalNoRush;
      expect(rushFeeDifference).toBeGreaterThan(299); // At minimum should be the rush fee
    });

    it('should charge rush fee exactly once', () => {
      const order = {
        items: [{ 
          sku: 'P6-POTATO', 
          title: '6-pack Potato', 
          kind: 'hot', 
          filling: 'potato', 
          qty: 1, 
          unitPriceCents: 1000,
          addOns: [] 
        }]
      };
      
      const contextWithRush = {
        profile: { tier: 'guest' },
        delivery: { zone: 'local', rush: true }
      };
      
      const contextNoRush = {
        profile: { tier: 'guest' },
        delivery: { zone: 'local', rush: false }
      };
      
      const totalWithRush = total(order, contextWithRush);
      const totalNoRush = total(order, contextNoRush);
      
      // Rush fee is $2.99 = 299 cents, plus 8% tax
      // The difference should be exactly the rush fee + tax on rush fee
      const difference = totalWithRush - totalNoRush;
      expect(difference).toBe(323);
    });
  
  });

});

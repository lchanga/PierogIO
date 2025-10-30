const { tax } = require('../../src/tax');

describe('tax', () => {
  it('taxes hot items at 8% (TaxAPI basis points)', () => {
    const order = {
      items: [
        {
          sku: 'P6-POTATO',
          title: '6-pack Potato',
          kind: 'hot',
          filling: 'potato',
          qty: 1,
          unitPriceCents: 1000,
          addOns: [],
        }
      ]
    };

    const delivery = {
      zone: 'local',
      rush: false
    };

  // No delivery fee for this simple case, pass 0
  const result = tax(order, delivery, 0);

    // Expect 8% tax on $10.00 => $0.80 => 80 cents
    expect(result).toBe(80);
  });
});

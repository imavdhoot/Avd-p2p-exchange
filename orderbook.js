class OrderBook {
  constructor() {
    this.orders = [];
    this.lock = false; // prevent race conditions
  }

  addOrder(order) {
    this.orders.push(order);
  }

  matchOrder(incoming) {
    const matched = [];
    const remaining = { ...incoming };

    this.orders = this.orders.filter(existing => {
      if (
        existing.side !== incoming.side &&
        existing.price === incoming.price &&
        remaining.amount > 0
      ) {
        const tradeAmount = Math.min(existing.amount, remaining.amount);
        matched.push({
          buyer: incoming.side === 'buy' ? incoming.id : existing.id,
          seller: incoming.side === 'sell' ? incoming.id : existing.id,
          price: incoming.price,
          amount: tradeAmount
        });

        existing.amount -= tradeAmount;
        remaining.amount -= tradeAmount;

        return existing.amount > 0; // keep if partially filled
      }
      return true; // keep non-matching
    });

    return { matched, remaining: remaining.amount > 0 ? remaining : null };
  }
}

module.exports = OrderBook;

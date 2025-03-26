const Link = require('grenache-nodejs-link');
const { PeerRPCServer, PeerRPCClient } = require('grenache-nodejs-http');
const OrderBook = require('./orderbook');
const readline = require('readline');
const { v4: uuidv4 } = require('uuid');
const { logWithRequestId } = require('./utility')

const PORT = parseInt(process.env.PORT || 1024 + Math.floor(Math.random() * 1000));
const SERVICE_NAME = `avd_exchange_service`;

// Setup link to Grape
const link = new Link({ grape: 'http://127.0.0.1:30001' });
link.start();

// Create RPC server
const server = new PeerRPCServer(link, { timeout: 300000 });
server.init();

const service = server.transport('server');
service.listen(PORT);

// Register this node with the network
setInterval(() => {
  link.announce(SERVICE_NAME, PORT, {});
}, 1000);

// RPC client to send orders to other peers
const client = new PeerRPCClient(link, {});
client.init();

const orderBook = new OrderBook();

// Server: Handle incoming order RPC calls
service.on('request', (rid, key, order, handler) => {
  const reqId = order.id;
  logWithRequestId(reqId, `RECEIVED ORDER ${JSON.stringify(order)}`);

  const { matched, remaining } = orderBook.matchOrder(order);

  matched.forEach(trade => {
    logWithRequestId(reqId, `TRADE ${trade.amount} @ ${trade.price} between ${trade.buyer} and ${trade.seller}`);
  });

  if (remaining) {
    orderBook.addOrder(remaining);
    logWithRequestId(reqId, `ORDER ADDED TO BOOK ${JSON.stringify(remaining)}`);
  }

  handler.reply(null, { status: 'processed', matched });
});

// CLI input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function promptOrder() {
  rl.question('\nEnter order (buy/sell amount price): ', async (input) => {
    const [side, amountStr, priceStr] = input.trim().split(' ');
    const amount = parseInt(amountStr);
    const price = parseFloat(priceStr);
    const reqId = uuidv4();

    if (!['buy', 'sell'].includes(side) || isNaN(amount) || isNaN(price)) {
      console.log(`[INVALID INPUT] Expected format: buy/sell amount price`);
      return promptOrder();
    }

    const order = {
      id: reqId,
      side,
      amount,
      price
    };

    logWithRequestId(reqId, `SENDING ORDER ${JSON.stringify(order)}`);

    // Find all known peers
    link.lookup(SERVICE_NAME, {}, (err, peers) => {
      if (err || !peers || peers.length === 0) {
        console.log('No peers found.');
        return promptOrder();
      }
console.log('##### peer::', peers)
      peers.forEach(peer => {
        client.request(peer, order, { timeout: 5000, force: true }, (err, data) => {
          if (err) {
            console.error(`[${reqId}] ERROR sending to peer ${peer}:`, err.message);
          } else {
            logWithRequestId(reqId, `RESPONSE FROM ${peer}: ${JSON.stringify(data)}`);
          }
        });
      });

      promptOrder();
    });
  });
}

promptOrder();

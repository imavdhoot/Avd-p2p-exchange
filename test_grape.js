const Link = require('grenache-nodejs-link');
const { PeerRPCClient } = require('grenache-nodejs-http');
const link = new Link({ grape: 'http://127.0.0.1:30001' });
link.start();

link.announce('test_service', 12345, {}, (err) => {
  console.log('Announce done', err);

  link.lookup('test_service', {}, (err, peer) => {
    console.log('Lookup result:', err, peer);

    const client = new PeerRPCClient(link, {});
    client.init();

    client.request(`http://${peer}`, {order: "some random thing"}, { timeout: 5000 }, (err2, data) => {
      if (err2) {
        console.error(`ERROR sending to peer ${peer}:`, err2.message);
      } else {
        console.log(`RESPONSE FROM ${peer}: ${JSON.stringify(data)}`);
      }
    });
    //process.exit();
  });
});

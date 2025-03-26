# AVD's P2P Distributed Exchange (Grenache + Node.js)

This project is a simplified **peer-to-peer distributed exchange** implemented in **Node.js** using the **Grenache framework**. where 
Each node:
- Maintains its own local order book
- Accepts orders via RPC
- Sends orders to peers for matching
- Matches trades and handles partial fills

---

## 💡 Features
- Decentralized P2P exchange (no central orderbook)
- Simple matching engine (exact price, FIFO matching)
- Fully in-memory, no DB or external storage
- CLI interface for submitting orders
- Order tracing with timestap in logs where order-id is printed in log lines

---

## 🚀 Getting Started

### 1. **Install Dependencies**
```bash
npm install grenache-nodejs-http grenache-nodejs-link uuid
```

### 2. **Start Grape Node (for service discovery)**
```bash
grape --dp 20001 --aph 30001 --bn '127.0.0.1:20002'
grape --dp 20002 --aph 40001 --bn '127.0.0.1:20001'
```

### 3. **Start Multiple Clients (Terminals)**
```bash
PORT=3001 node client.js
```
Open multiple terminals and run above command with different PORT to simulate multiple peer nodes.

### 4. **Place Orders via CLI**
```text
buy 10 100     # Buy 10 units at price 100
sell 5 100     # Sell 5 units at price 100
```
- Trades are matched automatically.
- Remaining unmatched quantities are added to the local orderbook.

---

## 📦 Project Structure
```
p2p-exchange/
├── orderbook.js           # Order matching engine
├── client.js              # Single P2P node (CLI + subscriber/publisher)
├── package.json           # Dependencies & scripts
└── README.md              # This guide
```

---

## 🧠 Concepts Used
- Grenache: Lightweight P2P microservices framework
- Grape: Service discovery using DHT
- Grenache Peer-to-peer communication

---

## 4. Test Plan

In this section we'll place 5 order from 3 separate terminals. 

### 🧪 STEP 1: spawn 3 peers
To run 3 instances run below commands one-by-one in separate terminals, this will create 3 instances of exchage:

```bash
PORT=3001 node client.js
PORT=3002 node client.js
PORT=3003 node client.js
```

Let them all start and register with Grape.

---

### 🧪 STEP 2: Place 5 different orders from 3 peers created in step 1 

| Terminal | Command           | Description                                  |
|----------|-------------------|----------------------------------------------|
| T1       | `buy 10 100`      | Starts a buy order for 10 at price 100       |
| T2       | `sell 5 100`      | Partially fills T1’s buy                     |
| T3       | `sell 3 100`      | Fills more of T1’s remaining buy             |
| T2       | `buy 2 100`       | New buy order to test future matches         |
| T1       | `sell 5 105`      | Won’t match (price mismatch), goes to book   |

### 🔍 Expected Output:

- Matching orders log `TRADE` lines
- Unmatched orders get logged as `ORDER ADDED TO BOOK`
- Every log includes:
  - `timestamp`
  - `request ID`
  - clear label (e.g. `RECEIVED ORDER`, `TRADE`, `ORDER ADDED TO BOOK`)

---


## ✅ Limitations and Improvements
- currently only exact matching is done for orders
- race conditions are not handled yet, can be fixed by implementing semaphors in Redis-cache
- Add unit tests for orderbook logic
- Visual logs or WebSocket-based UI to give vieww on "status of order Book and fulfillment"

---


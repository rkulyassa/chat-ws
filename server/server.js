const uWS = require('uWebSockets.js');
const decoder = new TextDecoder();
const encoder = new TextEncoder();
const PORT = 8080;

let clients = new Set();

class Message {
  constructor(id, username, text, timestamp) {
    this.id = id;
    this.username = username;
    this.text = text;
    this.timestamp = timestamp;
  }
}

class ChatQueue {
  constructor(size) {
    this.size = size;
    this.index = 0;
    this.queue = [];
  }

  add(message) {
    this.queue.push(message);
    if (this.queue.length > this.size) this.queue.shift();
    this.index++;
  }

  getMessages() {
    return this.queue;
  }
}
const chatQueue = new ChatQueue(10);

function updateClients() {
  const buffer = encoder.encode(JSON.stringify(chatQueue.getMessages()));
  clients.forEach(client => client.send(buffer));
}

uWS.App().ws('/*', {
  open: (ws) => {
    clients.add(ws);
    updateClients()
    //console.log(decoder.decode(ws.getRemoteAddressAsText()), 'connected');
  },
  message: (ws, data, isBinary) => {
    data = JSON.parse(decoder.decode(data));
    console.log(data);
    chatQueue.add(new Message(chatQueue.index, data[0], data[1], data[2]))
    updateClients()
  },
  close: (ws, code, message) => {
    clients.delete(ws)
    //console.log(decoder.decode(ws.getRemoteAddressAsText()), ' disconnected');
  }
}).listen(PORT, (token) => {
  if (token) {
    console.log(`WebSocket server listening on port ${PORT}`);
  } else {
    console.log('Failed to listen to port ' + PORT);
  }
});
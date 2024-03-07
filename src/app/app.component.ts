import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
if (typeof global !== 'undefined') global.WebSocket = require('ws');

const PORT = 8080;

class Message {
  id: number;
  username: string = '';
  text: string = '';
  timestamp: number;

  constructor(messageData: Message) {
    this.id = messageData.id;
    this.username = messageData.username;
    this.text = messageData.text;
    this.timestamp = messageData.timestamp;
  }
}

class MessageQueue {
  queue: Array<Message> = [];
  size: number;

  constructor(size: number) {
    this.size = size;
  }

  add(message: Message) {
    this.queue.push(message);
    if (this.queue.length > this.size) this.queue.shift();
  }

  getMessagesToRender() {
    let formatter = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
    return this.queue.map(message => {
      // `${formatter.format(message.timestamp)} | ${message.username}: ${message.text}`)
      return {
        username: message.username,
        text: message.text,
        timestamp: formatter.format(message.timestamp)
      }
    });
  }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgFor, FormsModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  inputUsername: string = '';
  inputMessage: string = '';
  messageQueue: MessageQueue;
  ws: WebSocket;

  constructor() {
    this.messageQueue = new MessageQueue(10);
    this.ws = new WebSocket(`ws://localhost:${PORT}`);
    this.ws.onopen = () => {
      console.log('WebSocket connection opened');
    }
    this.ws.onmessage = (event) => {
      JSON.parse(event.data).map((data: Message) => {
        const ids = this.messageQueue.queue.map(message => message.id);
        // console.log(ids, data.id, ids.includes(data.id));
        //return new Message(data);
        ids.includes(data.id) ? null : (console.log(data), this.messageQueue.add(new Message(data)));
      });
      // console.log(messages);
      // messages.forEach((message: Message) => {
      //   console.log(message);
      //   this.messageQueue.add(message)
      // });
    };
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    this.ws.onclose = () => {
      console.log('WebSocket connection closed');
    };
  }

  sendMessage(): void {
    if (this.inputMessage.trim()) {
      this.ws.send(JSON.stringify([this.inputUsername, this.inputMessage, Date.now()]));
      this.inputMessage = '';
    }
  }
}
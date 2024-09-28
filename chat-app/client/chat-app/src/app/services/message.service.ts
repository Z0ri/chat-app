import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class MessageService implements OnDestroy {
  private socket!: Socket;
  private getMessage$: Subject<void> = new Subject<void>();
  private connected: boolean = false;

  private messages: string[] = [];

  constructor(private ngZone: NgZone, private http: HttpClient) { }

  ngOnDestroy(): void {
    this.socket.disconnect();
  }

  public connect() {
    this.ngZone.runOutsideAngular(() => {
      this.socket = io("http://localhost:3000");

      this.socket.on("connect", () => {
        console.log("Connected to the server! " + this.socket.id);
        this.connected = true;
      });

      this.socket.on("message", (message) => {
        this.messages.push(message);
        this.getMessage$.next(message);
      });
    });
  }

  public sendMessage(message: string) {
    if (this.connected) {
      this.socket.emit("message", message); // emit message to the server
    } else {
      throw new Error("You are not connected.");
    }
  }

  public getConnected(): boolean {
    return this.connected;
  }

  public getNewMessage() {
    return this.getMessage$;
  }

  public getMessages() {
    return this.messages;
  }

  public getSocket() {
    return this.socket;
  }

  // New method to disconnect all sockets
  public disconnectAllSockets() {
    return this.http.post('http://localhost:3000/disconnect-all', {}).subscribe({
      next: (response) => {
        console.log('All clients disconnected:', response);
      },
      error: (err) => {
        console.error('Error disconnecting clients:', err);
      }
    });
  }
}

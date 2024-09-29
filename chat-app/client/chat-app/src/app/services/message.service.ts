import { Injectable, NgZone, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class MessageService{
  public socket!: Socket;
  private getMessage$: Subject<void> = new Subject<void>();
  private connected: boolean = false;

  private messages: string[] = [];

  constructor(
    private ngZone: NgZone,
    private http: HttpClient,
    private authService: AuthService
  ) { }

  public connect() {
    this.ngZone.runOutsideAngular(() => {
      this.socket = io("http://localhost:3000");

      this.socket.on("connect", () => {
        console.log("Connected to the server! " + this.socket.id);
        this.connected = true;
        this.setNewSocketId().subscribe();
      });

      this.socket.on("message", (message) => {
        this.messages.push(message);
        this.getMessage$.next(message);
      });

      this.socket.on("deleteSocket", (socketId: string) => {
        //delete socket in DB
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

  //load chat messages
  public loadMessages(){

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

  public getSocketId() {
    return this.socket.id;
  }

  public setNewSocketId(){
    return this.http.patch(`${this.authService.getDatabase()}/users/${this.authService.getUserId()}.json`, {socketId: this.getSocketId()});
  }

  public disconnectSocket(){
    if(this.socket){
      this.socket.disconnect();
    }
  }
  

  // Disconnect all sockets (if needed)
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

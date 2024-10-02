import { Injectable, NgZone, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, Subject, switchMap, take, takeUntil } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class MessageService implements OnDestroy{
  destroy$: Subject<void> = new Subject();

  private socket!: Socket;
  private getMessage$: BehaviorSubject<string> = new BehaviorSubject<string>("");
  private connected$: BehaviorSubject<string | undefined> = new BehaviorSubject<string | undefined>('');
  public checkStatus$: BehaviorSubject<string> = new BehaviorSubject<string>("");
  private loadChat$: BehaviorSubject<string> = new BehaviorSubject<string>("");
  
  private connected: boolean = false;

  private messages: string[] = [];

  constructor(
    private ngZone: NgZone,
    private http: HttpClient,
    private authService: AuthService
  ) { }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public connect() {
    this.ngZone.runOutsideAngular(() => {
        this.socket = io("http://localhost:3000");

        this.socket.on("connect", () => {
            console.log("Connected to the server! " + this.socket.id);
            this.connected = true;
            this.setNewSocketId().pipe(takeUntil(this.destroy$)).subscribe(() => {
                this.connected$.next(this.socket.id);
            });
        });

        this.socket.on("checkStatus",()=>{
          this.checkStatus$.next('');
        });

        this.socket.on("message", (message) => {
            console.log(typeof(message));
            this.messages.push(message);
            this.getMessage$.next(message);
        });

        this.socket.on("disconnect", () => {
            console.log("Socket disconnected");
            this.disconnectSocket();
        });

        // Listen for beforeunload to notify closing to the server
        window.addEventListener('beforeunload', () => {
            this.socket.emit("notifyClosing", this.authService.getUserId());
        });
    });
}


  public sendMessage(message: string, receiverId: string) {
    if (this.connected) {
      this.socket.emit("message", message); // emit message to the server
      //save new message in the database
      this.saveMessageInDB(message, receiverId).subscribe({
        next: response => console.log("Message successfully added to the database! " + response),
        error: error => console.error("Error adding new message to the database: " + error)
      });
    } else {
      throw new Error("You are not connected.");
    }
  }

  public saveMessageInDB(message: string, receiverId: string): Observable<any> {
    const currentUserId: string | null = this.authService.getUserId() ? this.authService.getUserId() : null;
    //check if user id is set
    if(currentUserId){
      //get messages stored in the database
      return this.getMessagesInDB(receiverId, currentUserId)
      .pipe(
        switchMap((messages: string[] = []) => {
          //get database messages
          let currentMessages = Array.isArray(messages) ? messages : [];
          //push new message
          currentMessages.push(message);
          //patch updated messages array
          return this.http.patch(`${this.authService.getDatabase()}/users/${receiverId}/messages.json`, {[currentUserId]: currentMessages}).pipe(takeUntil(this.destroy$));
        })
      );
    }else{
      throw new Error("User ID is not available.");
    }
  }
  

  public getMessagesInDB(userId: string, senderId: string | null){
    return this.http.get<string[]>(`${this.authService.getDatabase()}/users/${userId}/messages/${senderId}.json`).pipe(takeUntil(this.destroy$));
  }

  public removeSocket(){
    return this.http.put(`${this.authService.getDatabase()}/users/${this.authService.getUserId()}.json`, { socketId: 'none' })
  }

  //load chat messages
  public loadMessages(userId: string){
    this.loadChat$.next(userId);
  }

  public getLoadMessagesSubject(){
    return this.loadChat$.pipe(takeUntil(this.destroy$));
  }

  public getConnectedSubject(): BehaviorSubject<string | undefined>{
    return this.connected$;
  }

  public getConnected(): boolean {
    return this.connected;
  }

  public getCheckStatusSubject(){
    return this.checkStatus$;
  }

  public getNewMessage() {
    return this.getMessage$;
  }

  public getMessages() {
    return this.messages;
  }

  public getUserSocketId(userId: string){
    //get user's socket id
    return this.http.get(`${this.authService.getDatabase()}/users/${userId}/socketId.json`).pipe(takeUntil(this.destroy$));
  }

  public getSocket(){
    return this.socket;
  }

  public getSocketId() {
    return this.socket.id;
  }

  public setNewSocketId(){
    return this.http.patch(`${this.authService.getDatabase()}/users/${this.authService.getUserId()}.json`, {socketId: this.getSocketId()});
  }

  public closeSocket(){
    if(this.socket){
      this.socket.close();
    }
  }

  public disconnectSocket(){
    if(this.socket){
      this.socket.disconnect();
    }
  }
  

  // Disconnect all sockets (if needed)
  // public disconnectAllSockets() {
  //   return this.http.post('http://localhost:3000/disconnect-all', {}).subscribe({
  //     next: (response) => {
  //       console.log('All clients disconnected:', response);
  //     },
  //     error: (err) => {
  //       console.error('Error disconnecting clients:', err);
  //     }
  //   });
  // }
}

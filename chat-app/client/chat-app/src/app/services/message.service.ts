import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, catchError, Observable, of, Subject, switchMap, takeUntil } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Message } from '../models/Message';

@Injectable({
  providedIn: 'root'
})
export class MessageService implements OnDestroy{
  destroy$: Subject<void> = new Subject();

  private socket!: Socket;
  private getNewMessage$: BehaviorSubject<Message> = new BehaviorSubject<Message>(new Message('','',new Date()));
  private connected$: BehaviorSubject<string | undefined> = new BehaviorSubject<string | undefined>('');
  public checkStatus$: BehaviorSubject<string> = new BehaviorSubject<string>("");
  private loadChat$: BehaviorSubject<string> = new BehaviorSubject<string>("");
  
  private connected: boolean = false;

  private messages: Message[] = [];

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
            this.setNewSocketId().pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (response) =>{
                console.log("New socket id successfully set: " + response);
                this.connected$.next(this.socket.id);
              },
              error: error => console.error("Error setting new socket id: " + error)
            });
        });

        this.socket.on("checkStatus",()=>{
          this.checkStatus$.next('');
        });

        this.socket.on("message", (newMessage) => {
            console.log("I RECEIVED THE MESSAGE FROM THE SERVER: "+ newMessage);
            this.messages.push(newMessage);
            this.getNewMessage$.next(newMessage);
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


  public sendMessage(message: Message, receiverId: string) {
    if (this.connected) {
      this.getUserSocketId(receiverId)
        .pipe(
          switchMap((receiverSocketId: string) => {          
            return this.saveMessageInDB(message, receiverId).pipe(
              switchMap(response => {
                const newMessage = new Message(this.authService.getUserId(), message.content, new Date());

                // Verifica se il socket ID ricevuto è vuoto
                if (receiverSocketId) {
                  this.socket.emit("message", {message: newMessage, socketId: receiverSocketId});
                }else{
                  this.getNewMessage$.next(newMessage);
                }
                
                return of(response); 
              })
            );
          }),
          takeUntil(this.destroy$) 
        )
        .subscribe({
          next: response => console.log("Messaggio aggiunto al database con successo!", response),
          error: error => console.error("Errore nell'aggiunta del messaggio al database:", error)
        });
    } else {
      throw new Error("Non sei connesso.");
    }
  }



  public saveMessageInDB(message: Message, receiverId: string): Observable<any> {
    const currentUserId: string | null = this.authService.getUserId();
    const sortedUsers = [currentUserId, receiverId].sort();
    if (!currentUserId) {
        throw new Error("User not online.");
    }

    return this.getChatMessagesInDB(currentUserId, receiverId).pipe(
        switchMap((messages: Message[] = []) => {
            const updatedMessages: Message[] = Array.isArray(messages) ? messages : [];
            updatedMessages.push(message);
            
            return this.http.patch(`${this.authService.getDatabase()}/chats/${sortedUsers}.json`, { messages: updatedMessages })
                .pipe(
                    takeUntil(this.destroy$),
                    catchError(error => {
                        console.error("Error saving message:", error);
                        return of(null); // Handle the error appropriately
                    })
                );
        })
    );
  }

  

  public getChatMessagesInDB(user1: string | null, user2: string | null){
    const sortedUsers = [user1, user2].sort();
    console.log("Sorted users: " + sortedUsers);
    return this.http.get<Message[]>(`${this.authService.getDatabase()}/chats/${sortedUsers}/messages.json`,).pipe(takeUntil(this.destroy$));
  }

  public removeSocket(){
    return this.http.put(`${this.authService.getDatabase()}/users/${this.authService.getUserId()}.json`, { socketId: 'none' })
  }

  //load chat messages
  public getLoadChatSubject(): BehaviorSubject<string>{
    return this.loadChat$;
  }

  
  public getConnectedSubject(): BehaviorSubject<string | undefined>{
    return this.connected$;
  }

  public getCheckStatusSubject(){
    return this.checkStatus$;
  }

  public getNewMessageSubject() {
    return this.getNewMessage$;
  }

  public getMessages() {
    return this.messages;
  }

  public getUserSocketId(userId: string): Observable<string> {
    // Get user's socket ID
    return this.http.get<string>(`${this.authService.getDatabase()}/users/${userId}/socketId.json`)
      .pipe(takeUntil(this.destroy$));
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
}

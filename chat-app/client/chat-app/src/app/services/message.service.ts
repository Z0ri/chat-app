import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, of, Subject, switchMap, takeUntil } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Message } from '../models/Message';
import { CookieService } from 'ngx-cookie-service';
import { ContactsService } from './contacts.service';

@Injectable({
  providedIn: 'root'
})
export class MessageService implements OnDestroy{
  destroy$: Subject<void> = new Subject();

  private socket!: Socket;
  private getNewMessage$: BehaviorSubject<Message> = new BehaviorSubject<Message>(new Message('','','',new Date()));
  private getReceivedMessage$: BehaviorSubject<Message> = new BehaviorSubject(new Message('','','',new Date()));
  private connected$: BehaviorSubject<string | undefined> = new BehaviorSubject<string | undefined>('');
  private checkStatus$: BehaviorSubject<string | undefined> = new BehaviorSubject<string | undefined>("");
  private closing$: BehaviorSubject<string | null> = new BehaviorSubject<string | null>("");
  private loadChat$: BehaviorSubject<any> = new BehaviorSubject<any>({});
  private writing$: BehaviorSubject<string> = new BehaviorSubject("");

  private connected: boolean = false;
  private messages: Message[] = [];

  constructor(
    private ngZone: NgZone,
    private http: HttpClient,
    private authService: AuthService,
    private cookieService: CookieService,
    private contactsService: ContactsService
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
            this.checkStatus$.next(this.socket.id);
            //set username as online
            let userId = this.authService.getUserId();
            if(userId){
              this.authService.getOnlineUsersArray().push(userId); //add user to online users
              this.cookieService.set("onlineUsers", JSON.stringify(this.authService.getOnlineUsers())); //update the cookie
            }
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
        
        this.socket.on("message", (newMessage) => {
            console.log("I RECEIVED THE MESSAGE FROM THE SERVER: "+ newMessage.content);
            this.messages.push(newMessage);
            this.getNewMessage$.next(newMessage);
            this.getReceivedMessage$.next(newMessage);
        });

        this.socket.on("writing", (senderId)=>{
          this.writing$.next(senderId);
        });

        this.socket.on("checkStatus", (connectedSocket) =>{
          this.checkStatus$.next(connectedSocket);
        })

        this.socket.on("notifyClosing", (userId) => {
          this.closing$.next(userId);
        });

        this.socket.on("disconnect", () => {
            console.log("Socket disconnected");
            this.disconnectSocket();
        });

        // Listen for beforeunload to notify closing to the server
        window.addEventListener('beforeunload', () => {
          this.socket.emit("notifyClosing", this.authService.getUserId());
          this.cookieService.delete("onlineUsers");
        });
    });
  }


  public sendMessage(message: Message) {
    if (!this.connected) {
      throw new Error("You are not connected.");
    }
  
    this.getUserSocketId(message.receiverId)
      .pipe(
        switchMap((receiverSocketId: string) => {
          const newMessage = new Message(
            this.authService.getUserId(),
            message.receiverId,
            message.content,
            new Date()
          );
  
          // Save the message in the DB first
          return this.saveMessageInDB(newMessage, message.receiverId).pipe(
            switchMap(() => {
              // If the user is online, send the message via socket
              if (receiverSocketId) {
                this.socket.emit("message", { message: newMessage, socketId: receiverSocketId });
                return of(null); // Nothing more to do, message was sent
              } else {
                // If the user is offline, save the notification in the database
                return this.authService.getUserNotifications(message.receiverId).pipe(
                  switchMap((notifications: string[]) => {
                    let senderId = message.authorId || "";
                    let updatedNotifications: string[] = [];
                    
                    // Ensure notifications is an array, or default it to an empty array
                    if (Array.isArray(notifications)) {
                      updatedNotifications = [...notifications];
                    }
                    
                    // Only add the senderId if it's not already in the notifications array
                    if (!updatedNotifications.includes(senderId)) {
                      updatedNotifications.push(senderId);
                    }
                    
                    return this.http.patch(`${this.authService.getDatabase()}/users/${message.receiverId}.json`, { notifiedBy: updatedNotifications });
                  })
                );
              }
            }),
            map(() => newMessage) // Return the new message for the UI update
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (newMessage: Message) => {
          console.log("Message sent successfully!", newMessage);
          // Notify the UI about the new message
          this.getNewMessage$.next(newMessage);
        },
        error: (error) => {
          console.error("Error sending message:", error);
        }
      });
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
    return this.http.get<Message[]>(`${this.authService.getDatabase()}/chats/${sortedUsers}/messages.json`,).pipe(takeUntil(this.destroy$));
  }

  public removeSocket(){
    return this.http.put(`${this.authService.getDatabase()}/users/${this.authService.getUserId()}.json`, { socketId: 'none' })
  }

  public getReceivedMessageSubject(){
    return this.getReceivedMessage$;
  }

  public getWritingSubject(){
    return this.writing$;
  }

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

  public getClosingSubject(){
    return this.closing$;
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

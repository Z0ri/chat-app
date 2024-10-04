import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MessageComponent } from '../message/message.component';
import { MessageService } from '../../services/message.service';
import { skip, Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { Message } from '../../models/Message';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-chat-background',
  standalone: true,
  imports: [
    FormsModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    CommonModule,
    MessageComponent
  ],
  templateUrl: './chat-background.component.html',
  styleUrls: ['./chat-background.component.css'] // Corretto da styleUrl a styleUrls
})
export class ChatBackgroundComponent implements OnDestroy, OnInit, AfterViewInit {
  private destroy$: Subject<void> = new Subject();
  currentUserId: string | null = "";
  ownerId: string = "";
  sentMessages: string[] = [];
  receivedMessages: string[] = [];
  messages: Message[] = [];
  currentDate!: Date;

  constructor(
    private messageService: MessageService,
    private authService: AuthService,
    private cd: ChangeDetectorRef,
    private cookieService: CookieService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.currentUserId = this.authService.getUserId();
    this.currentDate = new Date();

    //set owner id
    this.ownerId = this.cookieService.get("ownerId") ? this.cookieService.get("ownerId") : this.ownerId;
  }

  ngAfterViewInit(): void {
    //load previous chat messages
    this.messageService.getLoadChatSubject()
      .pipe(takeUntil(this.destroy$), skip(1))
      .subscribe((chatOwnerId: string) => {
        this.cookieService.set("ownerId", chatOwnerId);
        this.loadMessages(this.currentUserId, chatOwnerId);
      });
    //display new message 
    this.messageService.getNewMessageSubject()
    .pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (message: Message) => {
        console.log("ownerId: " + this.ownerId);
        console.log("ownerId cookie: " + this.cookieService.get("ownerId"));
        console.log("receiverId" + message.receiverId);
        //check if the user is on the chat where the message is supposted to go
        this.messages.push(message);
        this.cd.detectChanges();
      },
      error: error => console.error("Error fetching new message: " + error)
    });
  }


  loadMessages(currentUserId: string | null, chatOwnerId: string){
    this.messages = [];
    //get messages from the chat
    this.messageService.getChatMessagesInDB(currentUserId, chatOwnerId)
    .subscribe({
      next: (messages: Message[] = []) => {
        this.messages = messages;
        this.cd.detectChanges();//update view
      },
      error: error => console.log("Error loading chat messages: " + error)
    });
  }

}

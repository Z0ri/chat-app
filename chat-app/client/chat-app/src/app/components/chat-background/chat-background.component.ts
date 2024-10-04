import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MessageComponent } from '../message/message.component';
import { MessageService } from '../../services/message.service';
import { skip, Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { Message } from '../../models/Message';

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
export class ChatBackgroundComponent implements OnDestroy, OnInit {
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
    private cd: ChangeDetectorRef
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.currentUserId = this.authService.getUserId();
    this.currentDate = new Date();
    this.messageService.getLoadChatSubject()
      .pipe(takeUntil(this.destroy$), skip(1))
      .subscribe((chatOwnerId: string) => {
        this.ownerId = chatOwnerId;
        this.loadMessages(this.currentUserId, chatOwnerId);
      });
  }


  loadMessages(currentUserId: string | null, chatOwnerId: string){
    //get messages from the chat
    this.messageService.getChatMessagesInDB(currentUserId, chatOwnerId)
    .subscribe({
      next: (messages: Message[]) => {
        this.messages = messages;
        messages.forEach(message => {
          console.log("contenuto messaggio: "+message.content);
          console.log("autore messaggio: "+message.authorId);
          console.log("owner id: "+this.ownerId);
        });
        //analize if each message was sent or received
        this.cd.detectChanges();
      },
      error: error => console.log("Error loading chat messages: " + error)
    })
    //iterate throught every message of the chat
    //push each message in the messages array
    //update view
  }

}

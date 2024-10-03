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
  ownerId: string = "";
  sentMessages: string[] = [];
  receivedMessages: string[] = [];

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
    console.log('ngOnInit called'); // Debug: Verifica se ngOnInit viene chiamato
    this.messageService.getLoadMessagesSubject()
      .pipe(takeUntil(this.destroy$))
      .subscribe((chatOwnerId: string) => {
        console.log(`Chat Owner ID: ${chatOwnerId}`); // Debug: Verifica il valore ricevuto
        this.ownerId = chatOwnerId; // Imposta l'ID del proprietario della chat
        this.loadReceivedMessages(chatOwnerId);
        this.loadSentMessages(chatOwnerId);
      });
    
    this.messageService.getNewMessageSubject()
      .pipe(takeUntil(this.destroy$), skip(1))
      .subscribe((message: string)=>{
        this.receivedMessages.push(message);
        this.cd.detectChanges();
      });

    this.messageService.getClientMessageSubject()
    .subscribe((message: string)=>{
      this.sentMessages.push(message);
      this.cd.detectChanges();
    })
  }

  loadReceivedMessages(chatOwnerId: string) {
    const userId = this.authService.getUserId();
    this.messageService.getMessagesInDB(userId, chatOwnerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (messages: string[] = []) => {
          console.log('Received Messages:', messages); // Debug: Log dei messaggi ricevuti
          this.receivedMessages = Array.isArray(messages) ? messages : []; // Assicurati che sia un array
          this.cd.detectChanges(); // Trigger change detection
        },
        error: error => console.error("Error getting received messages: ", error)
      });
  }

  loadSentMessages(chatOwnerId: string) {
    const userId = this.authService.getUserId();
    this.messageService.getMessagesInDB(chatOwnerId, userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (messages: string[] = []) => {
          console.log('Sent Messages:', messages); // Debug: Log dei messaggi inviati
          this.sentMessages = Array.isArray(messages) ? messages : []; // Assicurati che sia un array
          this.cd.detectChanges(); // Trigger change detection
        },
        error: error => console.error("Error getting sent messages: ", error)
      });
  }

}

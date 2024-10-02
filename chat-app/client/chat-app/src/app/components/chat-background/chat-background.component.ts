import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
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
  styleUrl: './chat-background.component.css'
})
export class ChatBackgroundComponent implements OnDestroy{
  destroy$: Subject<void> = new Subject();
  ownerId: string = "";
  messages: string[] = [];
  constructor(
    private messageService: MessageService,
    private authService: AuthService,
    private cd: ChangeDetectorRef
  ){}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  ngOnInit(): void {  
    //load previous messages
    this.messageService.getLoadMessagesSubject()
    .subscribe((userId: string)=>{
      this.messageService.getMessagesInDB(userId, this.authService.getUserId())
      .subscribe({
        next: (messages: string[] = []) => {
          this.ownerId = userId;
          if(messages){
            this.messages = messages;
          }else{
            this.messages = [];
          }
          this.cd.detectChanges();
        },
        error: error => console.error(`Error fetching ${userId}'s messages: ${error}`)
      });
    });
    
    //get new message
    this.messageService.getNewMessage()
    .pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (newMessage: string) => {
        this.messages.push(newMessage);
        this.cd.detectChanges();
      },
      error: (error) => {
        console.log("Error getting the message: " + error);
      }
    });
  }

}

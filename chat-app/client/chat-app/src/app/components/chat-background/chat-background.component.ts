import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MessageComponent } from '../message/message.component';
import { MessageService } from '../../services/message.service';
import { Subject, takeUntil } from 'rxjs';

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
  messages: string[] = [];
  constructor(
    private messageService: MessageService,
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
      console.log("Loading "+userId+"'s chat...");
    });
    
    //get new message
    this.messageService.getNewMessage()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.messages = this.messageService.getMessages();
        this.cd.detectChanges();
      },
      error: (error) => {
        console.log("Error getting the message: " + error);
      }
    });
  }

}

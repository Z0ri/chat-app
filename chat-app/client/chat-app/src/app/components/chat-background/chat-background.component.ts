import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MessageComponent } from '../message/message.component';
import { MessageService } from '../../services/message.service';

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
export class ChatBackgroundComponent {
  messages: string[] = [];
  constructor(
    private messageService: MessageService,
    private cd: ChangeDetectorRef
  ){}


  ngOnInit(): void {
    
    this.messageService.loadMessages();//load previous messages
    
    //get new message
    this.messageService.getNewMessage()
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

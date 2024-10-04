import { Component, NgZone, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import { MessageService } from '../../services/message.service';
import { Message } from '../../models/Message';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-message-input',
  standalone: true,
  imports: [
    FormsModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './message-input.component.html',
  styleUrl: './message-input.component.css'
})
export class MessageInputComponent implements OnInit{
  senderId: string | null = '';
  receiverId: string = '';
  constructor(
    private messageService: MessageService,
    private authService: AuthService
  ){}
  
  ngOnInit(): void {
    this.senderId = this.authService.getUserId();
    this.messageService.getLoadChatSubject()
    .subscribe({
      next: (userId: string) => {
        this.receiverId = userId;
      },
      error: (error) => console.error("Error getting the receiver id. " + error)
    });
  }

  sendMessage(form: NgForm){
    console.log(form.value.message);
    const message = new Message(this.senderId, form.value.message, new Date())
    this.messageService.sendMessage(message, this.receiverId);
    form.reset();
  }
}

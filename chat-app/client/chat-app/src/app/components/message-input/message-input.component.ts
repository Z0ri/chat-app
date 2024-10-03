import { Component, NgZone, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import { MessageService } from '../../services/message.service';
import { error } from 'console';
import { ContactsService } from '../../services/contacts.service';

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
  receiverId: string = '';
  constructor(private messageService: MessageService){}
  
  ngOnInit(): void {
    this.messageService.getLoadMessagesSubject()
    .subscribe({
      next: (userId: string) => {
        this.receiverId = userId;
      },
      error: (error) => console.error("Error getting the receiver id.")
    });
  }

  sendMessage(form: NgForm){
    this.messageService.sendMessage(form.value.message,this.receiverId);
    this.messageService.getClientMessageSubject().next(form.value.message);
    form.reset();
  }
}

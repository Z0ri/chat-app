import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import { MessageService } from '../../services/message.service';
import { CommonModule } from '@angular/common';
import { MessageComponent } from "../message/message.component";

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    FormsModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    CommonModule,
    MessageComponent
],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit{
  messages: string[] = [];
  constructor(
    private messageService: MessageService,
    private cd: ChangeDetectorRef
  ){}


  ngOnInit(): void {
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
    })

  }


}

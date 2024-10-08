import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import { MessageService } from '../../services/message.service';
import { Message } from '../../models/Message';
import { AuthService } from '../../services/auth.service';
import { Subject, takeUntil } from 'rxjs';

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
export class MessageInputComponent implements OnInit, OnDestroy{
  destroy$: Subject<void> = new Subject();
  senderId: string | null = '';
  receiverId: string = '';
  constructor(
    private messageService: MessageService,
    private authService: AuthService
  ){}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  ngOnInit(): void {
    this.senderId = this.authService.getUserId();
    this.messageService.getLoadChatSubject()
    .subscribe({
      next: (user: any) => {
        this.receiverId = user.userId;
      },
      error: (error) => console.error("Error getting the receiver id. " + error)
    });
  }

  sendMessage(form: NgForm){
    const message = new Message(this.senderId, this.receiverId, form.value.message, new Date())
    this.messageService.sendMessage(message);
    form.reset();
  }

  writing(){
    if(this.senderId){
      this.messageService.getUserSocketId(this.receiverId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((receiverSocketId: string)=>{
        console.log("retrieved socket id: " + receiverSocketId);
        const writingData = {
          senderId: this.senderId,
          receiverSocketId: receiverSocketId
        }
        if(receiverSocketId){
          //notify writing event
          this.messageService.getSocket().emit("writing", writingData);
        }else{
          console.error("Receiver's socket id not found.");
        }
      });
    }
  }
}

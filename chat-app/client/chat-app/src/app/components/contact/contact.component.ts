import { AfterViewInit, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import {MatCardModule} from '@angular/material/card';
import { MessageService } from '../../services/message.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { skip, Subject, takeUntil, timeoutWith } from 'rxjs';
import { ContactsService } from '../../services/contacts.service';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [MatCardModule, CommonModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent implements OnInit, AfterViewInit{
  destroy$: Subject<void> = new Subject<void>();
  @Input() ownerData!: any;
  contactName: string = 'Contact name';
  statusColor: string = 'red';
  status: boolean = false;
  writing: boolean = false;
  typingTimeout: any;
  opacity: number = 1;

  constructor(
    private messageService: MessageService,
    private authService: AuthService,
    private contactService: ContactsService,
    private cd: ChangeDetectorRef,
    private cookieService: CookieService
  ){}

  ngOnInit(): void {
    this.cookieService.delete("ownerId");

    this.contactName = this.ownerData.username;
    if(this.authService.getUserId() == this.ownerData.userId){
      this.contactName += " (Yourself)";
    }
    
    this.messageService.getLoadChatSubject().pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (selectedUser: any) => {
        //if this contact's owner isn't the user id that corrisponds to the owner id of the clicked contact
        selectedUser.userId != this.ownerData.userId ? this.opacity=0.5 : this.opacity=1;
        this.cd.detectChanges();
      },
      error: error => console.log("Error darkening the contact: " + error)
    });

    this.messageService.getWritingSubject()
    .pipe(takeUntil(this.destroy$), skip(1))
    .subscribe((senderId: string)=>{
      if (senderId === this.ownerData.userId) {
        if (this.typingTimeout) {
          clearTimeout(this.typingTimeout);
        }

        if (this.writing === false) {
          this.writing = true;
          this.cd.detectChanges();
        }

        this.typingTimeout = setTimeout(() => {
          this.writing = false;
          this.cd.detectChanges();
        }, 3000);

        //Hide the typing indicator when a new message is received.
        this.messageService.getNewMessageSubject()
        .pipe(takeUntil(this.destroy$), skip(1))
        .subscribe(()=>{
          this.writing = false;
          this.cd.detectChanges();
        });
      }
    });

  }

  ngAfterViewInit() {
    this.messageService.getCheckStatusSubject()
    .pipe(takeUntil(this.destroy$))
    .subscribe(()=>{
      this.authService.updateOnlineUsersFromDB()
        .then(() => {
          this.checkStatus();
        });
    });

    this.messageService.getClosingSubject()
    .pipe(takeUntil(this.destroy$))
    .subscribe((userId)=>{
      if(userId == this.ownerData.userId){
        this.status = false;
        this.statusColor = "red";
        this.cd.detectChanges();
      }
    });
  }

  loadChat(){
    //load owner's chat
    this.messageService.getLoadChatSubject().next(this.ownerData);
  }

  //check if owner is online
  private checkStatus() {
    const onlineUsers = this.cookieService.get("onlineUsers");
    if(onlineUsers.includes(this.ownerData.userId)){
      this.status = true;
      this.statusColor = "lightgreen"; 
    }
    if(!onlineUsers.includes(this.ownerData.userId)){
      this.status = false;
      this.statusColor = "red"; 
    }
    this.cd.detectChanges(); 
  }
}

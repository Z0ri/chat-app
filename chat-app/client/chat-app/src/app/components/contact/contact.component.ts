import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import {MatCardModule} from '@angular/material/card';
import { MessageService } from '../../services/message.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { skip, Subject, takeUntil } from 'rxjs';
import { ContactsService } from '../../services/contacts.service';
import { error } from 'console';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [MatCardModule, CommonModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent implements OnInit{
  destroy$: Subject<void> = new Subject<void>();
  @Input() ownerData!: any;
  contactName: string = 'Contact name';
  statusColor: string = 'red';
  status: boolean = false;
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


    this.messageService.checkStatus$
    .pipe(takeUntil(this.destroy$))
    .subscribe(()=>{
      this.checkStatus();
    });
    this.contactService.getDarkenContactsSubject().pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (selectedUserId) => {
        //if this contact's owner isn't the user id that corrisponds to the owner id of the clicked contact
        selectedUserId != this.ownerData.userId ? this.opacity=0.5 : this.opacity=1;
        this.cd.detectChanges();
      },
      error: error => console.log("Error darkening the contact: " + error)
    });
  }

  loadChat(){
    //load owner's chat
    this.messageService.getLoadChatSubject().next(this.ownerData.userId);
    //send a subject to make other contacts less visible
    this.contactService.getDarkenContactsSubject().next(this.ownerData.userId);
  }

  //check if owner is online
  private checkStatus() {
    this.authService.checkUserOnline(this.ownerData, (isOnline)=>{
      this.status = isOnline;
      this.statusColor = isOnline ? "lightgreen" : "red"; 
      this.cd.detectChanges(); 
    });
  }
}

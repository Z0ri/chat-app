import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import {MatCardModule} from '@angular/material/card';
import { MessageService } from '../../services/message.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Subject, takeUntil } from 'rxjs';

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

  constructor(
    private messageService: MessageService,
    private authService: AuthService,
    private cd: ChangeDetectorRef
  ){}

  ngOnInit(): void {
    this.contactName = this.ownerData.username;
    this.messageService.checkStatus$
    .pipe(takeUntil(this.destroy$))
    .subscribe(()=>{
      this.checkStatus();
      console.log("Checked contact status.");
    });
  }

  loadChat(){
    //load owner's chat
  }

  //check if owner is online
  private checkStatus() {
    this.messageService.checkUserOnline(this.ownerData, (isOnline) => {
      this.status = isOnline;
      this.statusColor = isOnline ? "lightgreen" : "red"; 
    });

    this.cd.detectChanges(); 
  }
  
}

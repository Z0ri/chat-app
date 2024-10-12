import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MessageService } from '../../services/message.service';
import { skip, Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contact-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contact-banner.component.html',
  styleUrl: './contact-banner.component.css'
})
export class ContactBannerComponent implements OnInit, OnDestroy, AfterViewInit{
  private destroy$: Subject<void> = new Subject();
  private owner: any;
  public username: string = "";
  private typingTimeout: any;
  public writing = false;

  constructor(
    private messageService: MessageService,
    private cd: ChangeDetectorRef,
  ){}

  ngAfterViewInit(): void {
    //get contact click
    this.messageService.getLoadChatSubject()
    .pipe(takeUntil(this.destroy$), skip(1))
    .subscribe((user: any)=>{
      this.owner = user;
      this.username = user.username; //set username
      this.cd.detectChanges();
    });
    //get writing subject
    this.messageService.getWritingSubject()
  .pipe(skip(1), takeUntil(this.destroy$))
  .subscribe((senderId: string) => {
    if (this.owner) {
      if (senderId === this.owner.userId) {
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
    }
  });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
  }
}

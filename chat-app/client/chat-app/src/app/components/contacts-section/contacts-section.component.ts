import { AfterViewInit, Component, NgZone, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { ContactComponent } from "../contact/contact.component";
import { ContactsService } from '../../services/contacts.service';
import { MessageService } from '../../services/message.service';
import { first, pipe, skip, Subject, take, takeUntil } from 'rxjs';

@Component({
  selector: 'app-contacts-section',
  standalone: true,
  imports: [ContactComponent],
  templateUrl: './contacts-section.component.html',
  styleUrl: './contacts-section.component.css'
})
export class ContactsSectionComponent implements AfterViewInit, OnDestroy{
  private destroy$ = new Subject<void>();
  
  @ViewChild('contacts', { read: ViewContainerRef }) contactsContainer!: ViewContainerRef;

  constructor(
    private contactsService: ContactsService,
    private messageService: MessageService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    this.messageService.getConnectedSubject()
      .pipe(skip(1), takeUntil(this.destroy$))
      .subscribe(() => {
        this.contactsService.createContactElements(this.contactsContainer); // Load contacts
      });
    this.messageService.getSocket().emit("checkOnline");
  }
  
}

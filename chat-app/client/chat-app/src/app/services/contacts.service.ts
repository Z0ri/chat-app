import { ComponentRef, Injectable, OnInit, ViewContainerRef } from '@angular/core';
import { ContactComponent } from '../components/contact/contact.component';
import { AuthService } from './auth.service';
import { BehaviorSubject, catchError, Observable, of, Subject, switchMap, takeUntil } from 'rxjs';
import { MessageService } from './message.service';
import { HttpClient } from '@angular/common/http';
import { User } from '../models/User';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root'
})
export class ContactsService{
  private destroy$: Subject<void> = new Subject<void>();
  private notifiedContacts: User[] = [];
  private initializedNotifiedContacts: boolean = false;

  constructor(
    private authService: AuthService,
    private cookieService: CookieService,
    private http: HttpClient
  ) {
    //initialize array a single time 
    if(!this.initializedNotifiedContacts){
      this.initializeNotifiedContacts();
    }
  }

  ngOnDestroy() {
    // Emit a value to complete all subscriptions
    this.destroy$.next();
    this.destroy$.complete();
  }

  public createContactElements(container: ViewContainerRef){ 
    const contactRefs: ComponentRef<ContactComponent>[] = [];
    this.authService.getUsers()
    .pipe(takeUntil(this.destroy$))
    .subscribe((users: any) => {
      if(users){
        for(let user of Object.keys(users)){
          const contactRef = container.createComponent(ContactComponent);
          contactRef.instance.ownerData = users[user];
          contactRefs.push(contactRef);
        }
      }
      return contactRefs;
    });
  }

  private initializeNotifiedContacts(): void {
    const contacts = this.cookieService.get("notifiedContacts");
    if (contacts) {
      this.notifiedContacts = JSON.parse(contacts);
    } else {
      console.log("No notified contacts found.");
    }
  }

  public addNotifiedContact(contact: User){
    this.notifiedContacts.push(contact);
    this.cookieService.set("notifiedContacts", JSON.stringify(this.notifiedContacts));
  }

  public removeNotifiedContact(contactToRemove: User) {
    this.notifiedContacts = this.notifiedContacts.filter(contact => contact.userId !== contactToRemove.userId);
    this.cookieService.set("notifiedContacts", JSON.stringify(this.notifiedContacts));

    this.authService.removeUserNotification(contactToRemove.userId)
    .subscribe({
      next: response => console.log("Notification removed with success: ", response),
      error: error => console.log("Error removing notification: ", error)
    });
  }  

  public getNotifiedContacts(): User[]{
    return this.notifiedContacts;
  }
}

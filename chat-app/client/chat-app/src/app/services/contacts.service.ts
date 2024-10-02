import { ComponentRef, Injectable, ViewContainerRef } from '@angular/core';
import { ContactComponent } from '../components/contact/contact.component';
import { AuthService } from './auth.service';
import { BehaviorSubject, Subject, switchMap, takeUntil } from 'rxjs';
import { MessageService } from './message.service';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ContactsService {
  private destroy$: Subject<void> = new Subject<void>();
  private darkenContacts$: Subject<void> = new Subject();

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private messageService: MessageService
  ) { }

  ngOnDestroy() {
    // Emit a value to complete all subscriptions
    this.destroy$.next();
    this.destroy$.complete();
  }

  createContactElements(container: ViewContainerRef){ 
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

  getDarkenContactsSubject(){
    return this.darkenContacts$;
  }
}

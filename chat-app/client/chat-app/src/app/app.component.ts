import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import { MessageService } from './services/message.service';
import {MatSidenavModule} from '@angular/material/sidenav';
import { ChatComponent } from "./components/chat/chat.component";
import { MessageInputComponent } from "./components/message-input/message-input.component";
import { ChatBackgroundComponent } from "./components/chat-background/chat-background.component";
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { ContactsService } from './services/contacts.service';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ChatComponent, MatSidenavModule, MatButtonModule, MessageInputComponent, ChatBackgroundComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy{
  title = 'chat-app';
  showFiller = false;

  constructor(
    private messageService: MessageService,
    private authService: AuthService,
    private cookieService: CookieService
  ){}

  ngOnDestroy(): void {
    this.cookieService.delete("notifiedContacts"); 
    this.messageService.disconnectSocket();
    this.messageService.closeSocket();
  }

  ngOnInit(): void {
    let userId = this.authService.getUserId() || '';
    //if logged, connect to  node server
    if(this.authService.checkLogged()){
      this.messageService.connect();
    }
    //set online users from DB
    this.authService.updateOnlineUsersFromDB();
    
    this.authService.getUserNotifications(userId)
    .subscribe({
      next: (notifications: string[])=>{
        if(notifications){
          this.authService.getNotificationSubject().next(notifications);
        }
      },
      error: error => console.log(`Error getting user notifications`, error)
    });



    // if(typeof sessionStorage !== 'undefined'){
    //   sessionStorage.removeItem("userId");
    // }
    //redirect to login page if user is not logged /*TO MODIFY WITH LOG OUT*/
    // this.authService.checkLogged() ? this.router.navigate(['/chat']) : this.router.navigate(['/login']);
  }

}

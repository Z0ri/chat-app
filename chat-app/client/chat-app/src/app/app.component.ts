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
    private router: Router
  ){}

  ngOnDestroy(): void {
    this.messageService.disconnectSocket();
  }

  ngOnInit(): void {
    if(this.authService.checkLogged()){
      this.messageService.connect();
    }
    //redirect to login page if user is not logged
    this.authService.checkLogged() ? this.router.navigate(['/chat']) : this.router.navigate(['/login']);
  }

}

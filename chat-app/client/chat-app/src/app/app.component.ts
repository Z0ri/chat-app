import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import { MessageService } from './services/message.service';
import {MatSidenavModule} from '@angular/material/sidenav';
import { ChatComponent } from "./components/chat/chat.component";
import { MessageInputComponent } from "./components/message-input/message-input.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ChatComponent, MatSidenavModule, MatButtonModule, MessageInputComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit{
  title = 'chat-app';
  showFiller = false;

  constructor(private messageService: MessageService){}

  ngOnInit(): void {
    this.messageService.connect();
  }

}

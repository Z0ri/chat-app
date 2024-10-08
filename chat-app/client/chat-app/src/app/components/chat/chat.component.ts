import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { ChatBackgroundComponent } from '../chat-background/chat-background.component';
import { MessageInputComponent } from '../message-input/message-input.component';
import { ContactComponent } from "../contact/contact.component";
import { ContactsSectionComponent } from "../contacts-section/contacts-section.component";
import { ContactBannerComponent } from "../contact-banner/contact-banner.component";

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    MatSidenavModule,
    MatButtonModule,
    MessageInputComponent,
    ChatBackgroundComponent,
    ContactComponent,
    ContactsSectionComponent,
    ContactBannerComponent
],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent{

}

import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import { MessageService } from '../../services/message.service';
import { CommonModule } from '@angular/common';
import { MessageComponent } from "../message/message.component";
import { MatSidenavModule } from '@angular/material/sidenav';
import { ChatBackgroundComponent } from '../chat-background/chat-background.component';
import { MessageInputComponent } from '../message-input/message-input.component';
import { ContactComponent } from "../contact/contact.component";
import { ContactsSectionComponent } from "../contacts-section/contacts-section.component";

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    MatSidenavModule,
    MatButtonModule,
    MessageInputComponent,
    ChatBackgroundComponent,
    ContactComponent,
    ContactsSectionComponent
],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent{

}

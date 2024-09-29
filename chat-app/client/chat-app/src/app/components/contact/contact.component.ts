import { Component, Input } from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [MatCardModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent {
  @Input() ownerId!: string;
  @Input() contactName: string = "Contact name";

  loadChat(){
    //load owner's chat
  }
}

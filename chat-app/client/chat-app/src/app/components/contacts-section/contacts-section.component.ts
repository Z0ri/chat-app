import { Component } from '@angular/core';
import { ContactComponent } from "../contact/contact.component";

@Component({
  selector: 'app-contacts-section',
  standalone: true,
  imports: [ContactComponent],
  templateUrl: './contacts-section.component.html',
  styleUrl: './contacts-section.component.css'
})
export class ContactsSectionComponent {

}

import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './message.component.html',
  styleUrl: './message.component.css'
})
export class MessageComponent implements OnInit{
  ngOnInit(): void {
    console.log(this.class);
  }
  @Input() content: string = "";
  @Input() class: string = "message-container";
  
}

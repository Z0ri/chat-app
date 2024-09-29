import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { HttpClient } from '@angular/common/http';
import { User } from '../../models/User';
import { AuthService } from '../../services/auth.service';
import { MessageService } from '../../services/message.service';
import { RouterModule } from '@angular/router';
import { Console, error } from 'console';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    RouterModule,
    CommonModule
  ],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.css'
})
export class SignUpComponent implements OnInit{
  signupForm!: FormGroup;
  usernameError: string = "";
  emailError: string = "";
  passwordError: string = "";
  constructor(
    private authService: AuthService,
    private messageService: MessageService
  ){}

  ngOnInit(): void {
    this.signupForm = new FormGroup({
      username: new FormControl('', [Validators.maxLength(12), Validators.required]),
      email: new FormControl('', [Validators.email, Validators.required]),
      password: new FormControl('', [Validators.required])
    });
  }

  register(){
    const user = new User(
      this.messageService.getSocketId(),
      this.signupForm.get('username')?.value,
      this.signupForm.get('email')?.value,
      this.signupForm.get('password')?.value
    );

    if(this.signupForm.valid){
      this.authService.signUp(user);
      this.messageService.connect();
      this.signupForm.reset();
    }else{
      this.showErrors('username');
      this.showErrors('email');
      this.showErrors('password');
    }
  }

  showErrors(inputName: string): void {
    switch(inputName){
      case "username":
        if (this.signupForm.get('username')?.invalid) {
          if (this.signupForm.get('username')?.errors?.['required']) {
            this.usernameError = 'Username is required.';
          } else if (this.signupForm.get('username')?.errors?.['maxlength']) {
            this.usernameError = 'Username must not exceed 12 characters.';
          }
        }else{
          this.usernameError = "";
        }
        break;
      case "email":
        if (this.signupForm.get('email')?.invalid) {
          if (this.signupForm.get('email')?.errors?.['required']) {
            this.emailError = "Email is required";
          } else if (this.signupForm.get('email')?.errors?.['email']) {
            this.emailError = "Incorrect email format"
          }
        }else{
          this.emailError = "";
        }
        break;
      case "password":
        if (this.signupForm.get('password')?.invalid) {
          if (this.signupForm.get('password')?.errors?.['required']) {
            this.passwordError = "password is required";
          }
        }else{
          this.usernameError = "";
        }
        break;
    }
  }
}

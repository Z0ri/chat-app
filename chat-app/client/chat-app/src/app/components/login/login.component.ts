import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MessageService } from '../../services/message.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    RouterModule,
    CommonModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit{
  loginForm!: FormGroup;
  invalidForm: any = {error: false};
  invalidCredentials: any = {error: false};

  constructor(
    private authService: AuthService,
    private messageService: MessageService,
    private router: Router,
    private cd: ChangeDetectorRef
  ){}

  ngOnInit(): void {
    this.loginForm = new FormGroup({
      usernameEmail: new FormControl('', Validators.required),
      password: new FormControl('', Validators.required)
    });
  }

  login(){
    const loginUser = {
      usernameEmail: this.loginForm.get('usernameEmail')?.value,
      password: this.loginForm.get('password')?.value
    }
    if(this.loginForm.valid){
      this.authService.login(loginUser).subscribe((success) => {
        if (success) {
          //make snackbar appear
          this.messageService.connect();
          this.router.navigate(['/chat']);
        } else {
          //show an error
          if(!this.invalidForm.error){
            this.authService.showError(this.invalidCredentials);
            this.cd.detectChanges();
          }
        }
      });
    }else{
      //show an error
      if(!this.invalidCredentials.error){
        this.authService.showError(this.invalidForm);
        this.cd.detectChanges();
      }
    }
  }
}

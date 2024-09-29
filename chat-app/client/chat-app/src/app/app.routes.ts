import { Routes } from '@angular/router';
import { SignUpComponent } from './components/sign-up/sign-up.component';
import { ChatComponent } from './components/chat/chat.component';
import { LoginComponent } from './components/login/login.component';

export const routes: Routes = [
    {path: 'chat', component: ChatComponent},
    {path: 'sign-up', component: SignUpComponent},
    {path: 'login', component: LoginComponent}
];

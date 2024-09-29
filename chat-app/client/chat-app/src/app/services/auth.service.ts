import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from '../models/User';
import { catchError, map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private http: HttpClient,
  ) { }

  public login(loginUser: any): Observable<boolean> {
    return this.http.get<{ [key: string]: User }>("https://chat-app-3dfec-default-rtdb.firebaseio.com/users.json")
      .pipe(
        map(users => {
          for (let key of Object.keys(users)) {
            const user = users[key];
            if (
              (loginUser.usernameEmail === user.username || loginUser.usernameEmail === user.email) &&
              loginUser.password === user.password
            ) {
              this.setUserId(key);
              console.log("impostato.");
              return true; 
            }
          }
          return false;
        }),
        catchError(error => {
          console.error("Error logging in: ", error);
          return of(false); // Return false in case of error
        })
      );
  }
  
  public signUp(user: User){
    this.http.post<{[key: string]: User}>(`${this.getDatabase()}/users.json`, user)
    .subscribe({
      next: (response) => {
        this.setUserId(response["name"].toString());
        console.log("User correctly registred!");
      },
      error: (error) => {
        console.error("Error in user registration. " + error);
      }
    });
  }

  public checkLogged(): boolean{
    if(this.checkSessionStorage()){
      if(sessionStorage.getItem("userId")){
        return true;
      }else{
        return false;
      }
    }
    return false;
  }

  public checkSessionStorage(){
    if(typeof sessionStorage !== 'undefined'){
      return true;
    }else{
      return false;
    }
  }

  public removeSocket(){
    return this.http.patch(`${this.getDatabase()}/users/${this.getUserId()}.json`, {socket: ""});
  }

  public getUserId(){
    if (this.checkSessionStorage()){
      return sessionStorage.getItem("userId");
    }
    return null;
  }

  public setUserId(userId: string){
    if(this.checkSessionStorage()){
      sessionStorage.setItem("userId", userId);
    }
  }

  public showError(invalid: { error: boolean }) {
    invalid.error = true;
    setTimeout(() => {
      invalid.error = false;
    }, 2000);
  }


  public getDatabase(){
    return "https://chat-app-3dfec-default-rtdb.firebaseio.com";
  }
}

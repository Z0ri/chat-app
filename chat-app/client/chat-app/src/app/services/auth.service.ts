import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from '../models/User';
import { catchError, map, Observable, of, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { MessageService } from './message.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  destroy$: Subject<void> = new Subject<void>();
  constructor(
    private http: HttpClient
    // private messageService: MessageService
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
  public signUp(user: User): Observable<any> {
    return this.http.post<{[key: string]: User}>(`${this.getDatabase()}/users.json`, user)
      .pipe(
        tap((response) => {
          this.setUserId(response["name"].toString());
        }),
        switchMap((response) => this.setIDinDB(response["name"].toString())),
        tap(() => {
          console.log("User correctly registered!");
        })
      );
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

  public deleteSocketId(destroy$: Subject<void>) {
    return this.getUsers()
      .pipe(
        switchMap((users: any) => {
          return this.http.patch(`${this.getDatabase()}/users/${this.getUserId()}.json`, { socketId: '' })
            .pipe(takeUntil(destroy$));  // Ensure HTTP request is canceled if component is destroyed
        })
      );
  }

  public checkUserOnline(user: any, callback: (isOnline: boolean) => void): void {
    this.getUser(user.userId)
    .subscribe((userData: any) => {
      if(userData){
        const online = userData.socketId !== '';
        callback(online);
      }
    });
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

  public setIDinDB(userId: string): Observable<any> {
    return this.http.patch(`${this.getDatabase()}/users/${this.getUserId()}.json`, { userId: userId });
  }

  
  public getUsers(): Observable<any>{
    return this.http.get(`${this.getDatabase()}/users.json`).pipe(takeUntil(this.destroy$));
  }

  public getUser(userId: string){
    return this.http.get(`${this.getDatabase()}/users/${userId}.json`).pipe(takeUntil(this.destroy$));
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

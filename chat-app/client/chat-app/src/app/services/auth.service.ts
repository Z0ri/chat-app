import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from '../models/User';
import { BehaviorSubject, catchError, map, Observable, of, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { MessageService } from './message.service';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private onlineUsers: string[] = [];
  private destroy$: Subject<void> = new Subject<void>();
  private getNotifications$: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);

  constructor(
    private http: HttpClient,
    private cookieService: CookieService
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
              this.setUserId(key); //set user id in session storage
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
        console.log("user: " + userData.username);
        console.log("socket id: " + userData.socketId);
        const online = userData.socketId !== '';
        console.log(online);
        callback(online);
      }
    });
  }

  public updateOnlineUsersFromDB(): Promise<void> {
    return new Promise((resolve) => {
      this.getUsers()
        .subscribe((users: any[]) => {
          for (let user of Object.values(users)) {
            if (user.socketId && !this.onlineUsers.includes(user.userId)) {
              this.onlineUsers.push(user.userId);
              this.cookieService.set("onlineUsers", JSON.stringify(this.onlineUsers));
            }
          }
          
          // Resolve the promise after processing users
          resolve();
        });
    });
  }
  
  public updateOnlineUsersCookie(userId: string) {
    // Get the "onlineUsers" cookie
    const onlineUsersCookie = this.cookieService.get("onlineUsers");
    
    // Try to parse the cookie, or create an empty array if it's invalid or empty
    let onlineUsersArray: string[] = [];
    
    if (onlineUsersCookie) {
      try {
        onlineUsersArray = JSON.parse(onlineUsersCookie);
        
        // Ensure the parsed data is an array
        if (!Array.isArray(onlineUsersArray)) {
          onlineUsersArray = [];
        }
      } catch (e) {
        console.error("Error parsing onlineUsers cookie:", e);
      }
    }
  
    // Add the new userId if it's not already in the array
    if (!onlineUsersArray.includes(userId)) {
      onlineUsersArray.push(userId);
    }
  
    // Save the updated array back into the cookie as a JSON string
    this.cookieService.set("onlineUsers", JSON.stringify(onlineUsersArray));
  }
  


  public getUsersSockets(): string[]{
    const usersSockets: string[] = [];
    this.getUsers()
    .subscribe((users: any)=>{
      for(let user of Object.keys(users)){
        usersSockets.push(users[user].socketId);
      }
    });
    console.log("from authservice func: ");
    console.log(usersSockets);
    return usersSockets;
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

  public getUserNotifications(userId: string): Observable<string[]>{
    return this.http.get<string[]>(`${this.getDatabase()}/users/${userId}/notifiedBy.json`);
  }

  public removeUserNotification(removedId: string): Observable<any>{
    const currentUserId = this.getUserId() || "";
    const removedUserId = removedId || "";
    return this.getUserNotifications(currentUserId)
    .pipe(
      switchMap((notifications: string[]) => {
        let updatedNotifications = [...notifications];
        updatedNotifications = updatedNotifications.filter(id => id != removedUserId);
        return this.http.patch(`${this.getDatabase()}/users/${this.getUserId()}.json`, {notifiedBy : updatedNotifications})
      })
    )
  }

  public getOnlineUsersArray(){
    return this.onlineUsers;
  }

  public getOnlineUsers(){
    return this.cookieService.get("onlineUsers");
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
  
  public getUserame(userId: string | null){
    if(userId){
      return this.http.get<string>(`${this.getDatabase()}/users/${userId}/username.json`);
    }
    return of("Error getting the user's username: userId not found.");
  }

  public showError(invalid: { error: boolean }) {
    invalid.error = true;
    setTimeout(() => {
      invalid.error = false;
    }, 2000);
  }

  public getNotificationSubject(){
    return this.getNotifications$;
  }


  public getDatabase(){
    return "https://chat-app-3dfec-default-rtdb.firebaseio.com";
  }
}

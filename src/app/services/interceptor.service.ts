import { Injectable } from "@angular/core";
import { BehaviorSubject, Subject } from "rxjs";

@Injectable({
    providedIn : 'root'
})

export class SpinnerService {
   public isLoading$ : BehaviorSubject<boolean> = new BehaviorSubject(false);
   public spinnerVisible$ = this.isLoading$.asObservable();
   show(){
    this.isLoading$.next(true);
   }
   
   hide(){
    this.isLoading$.next(false);
   }

}


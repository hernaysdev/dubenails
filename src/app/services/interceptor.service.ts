import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

// Spinner global de las peticiones. Cuenta las que estan en curso (antes la primera que terminaba lo
// ocultaba aunque otras siguieran) y permite silenciarlo un momento (autorecarga cada 30 s).
@Injectable({
    providedIn : 'root'
})
export class SpinnerService {
   public isLoading$ : BehaviorSubject<boolean> = new BehaviorSubject(false);
   public spinnerVisible$ = this.isLoading$.asObservable();
   private enCurso = 0;
   private silencioHasta = 0;

   show(){
    this.enCurso++;
    this.isLoading$.next(true);
   }

   hide(){
    this.enCurso = Math.max(0, this.enCurso - 1);
    if (this.enCurso === 0) this.isLoading$.next(false);
   }

   // las peticiones que empiecen en los proximos ms no muestran spinner (pantallas que se actualizan solas)
   silenciar(ms: number) { this.silencioHasta = Math.max(this.silencioHasta, Date.now() + ms); }
   get silenciado() { return Date.now() < this.silencioHasta; }
}

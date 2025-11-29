import { Injectable, signal, Signal } from "@angular/core";


@Injectable({
    providedIn: 'root'
  })

  export class SignalService {

    registroExitoso = signal(false);


    setRegistroExitoso(){
        this.registroExitoso.update(value => !value)
    }
    getRegistroExitoso(){
        return this.registroExitoso();
    }


  }
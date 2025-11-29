import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-registrar-usuario',
  standalone: false,
  templateUrl: './registrar-usuario.component.html',
  styleUrl: './registrar-usuario.component.scss'
})
export class RegistrarUsuarioComponent {
  @Output() registroExitoso: EventEmitter<any> = new EventEmitter();
  
  showRegistro: boolean = true;
  constructor(){

  }
  onChange(event:boolean){
    this.showRegistro = !event;
    this.registroExitoso.emit(true);
    }
  

}

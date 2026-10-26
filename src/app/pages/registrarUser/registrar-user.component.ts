import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-registrar-user',
  standalone: false,
  templateUrl: './registrar-user.component.html',
  styleUrl: './registrar-user.component.scss'
})
export class RegistrarUserComponent {
  router = inject(Router)
  // el guard manda ?returnUrl= (por ejemplo /mis-citas); despues del login se vuelve ahi
  destino: string = inject(ActivatedRoute).snapshot.queryParamMap.get('returnUrl') || '/agenda';
  registrar: boolean = true;
  textbuttom: string = 'Registra Nueva Cuenta';
  title:string = 'Iniciar Sesion';


  login() {
    this.registrar = !this.registrar;
    if (this.registrar) {
      this.textbuttom = 'Registra Nueva Cuenta';
      this.title = 'Iniciar Sesion';
    } else {
      this.textbuttom = 'Iniciar Sesion';
      this.title = 'Registrate'
    }
  }

}

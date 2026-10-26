import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { EventsService } from 'src/app/services/events.service';
import { UsuariosService } from 'src/app/services/usuarios.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-recuperar-clave',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './recuperar-clave.component.html',
  styleUrl: './recuperar-clave.component.scss'
})
export class RecuperarClaveComponent {
  
  public form !:FormGroup;
  public formTwo !: FormGroup;
  error: boolean = false;
  errorTwo: boolean = false;
  eventsService = inject(EventsService);
  usuariosService = inject(UsuariosService);
  router = inject(Router);
  url: string = '';
  token: string = '';
  mensajeError = '';

  ngOnInit() {
    this.router.events.subscribe((data: any) => {
      const datos = data.routerEvent.url.split('/');
      this.token = datos[2]
      this.url = datos[1];
       if(this.url === 'recuperar'){
         this.formTwo = new FormGroup({
           password: new FormControl('', [Validators.required, Validators.minLength(6)]),
           password2: new FormControl('', [Validators.required, Validators.minLength(6)])
         })
       }
      })
        this.form = new FormGroup({
          email: new FormControl('', [Validators.required, Validators.email])
        }) 
  }



  OnSubmit(){
    this.mensajeError = '';
    if(this.form.valid){
      this.error = false;
      const { email }= this.form.value
      this.usuariosService.enviarEmail({email :email.toLocaleLowerCase()}).subscribe({next: (data:any) => {
        this.eventsService.alertMessage('success','Mensaje Enviado Revisa tu Correo...');
        this.form.addControl('email', {value: ''})
        this.url = '';
        setTimeout(() => {

          window.location.reload()
        },3000)
      }, error: (err) => {
        this.mensajeError = typeof err === 'string' && err ? err : 'No pudimos enviar el correo. Intenta de nuevo.';
      }}) 
    }else{
      this.error = true;
      this.mensajeError = 'Escribe un correo válido.';
    }
  }


  OnSubmitTwo() : any{
    this.mensajeError = '';
    const { password, password2 }= this.formTwo.value;
    if(password !== password2){
      this.mensajeError = 'Las claves no coinciden.';
      return this.errorTwo = true;
    }
    if(!password || password.length < 6){
      this.mensajeError = 'La clave debe tener al menos 6 caracteres.';
      return this.errorTwo = true;
    }
    if(this.formTwo.valid){
      this.errorTwo = false;
      this.usuariosService.recuperarClave({password , token: this.token}).subscribe({next: (data:any) => {
        this.formTwo.addControl('password', {value: ''})
        this.formTwo.addControl('password2', {value: ''})
        this.url = '';
        this.eventsService.alertMessage('success','Su Contraseña se actualizado con Exito!!!');

        setTimeout(() => {
          this.router.navigateByUrl('home')
        },3000)
      }, error: (err) => {
        this.mensajeError = typeof err === 'string' && err ? err : 'El link venció o no es válido. Pide uno nuevo.';
      }}) 
    }else{
      this.errorTwo = true;
      this.mensajeError = 'Revisa la clave.';
    }
  }


  write(e:any){

    const { password , password2 } = this.formTwo.value;
    if(password || password2){
      this.errorTwo = false;
    }

  }
  

}

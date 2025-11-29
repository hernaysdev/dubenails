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
        this.eventsService.alertMessage('error',`${err}`);
      }}) 
    }else{
      this.error = true;
    }
  }


  OnSubmitTwo() : any{
    const { password, password2 }= this.formTwo.value;
    if(password !== password2){
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
        this.eventsService.alertMessage('error',`${err}`);
      }}) 
    }else{
      this.errorTwo = true;
    }
  }


  write(e:any){

    const { password , password2 } = this.formTwo.value;
    if(password || password2){
      this.errorTwo = false;
    }

  }
  

}

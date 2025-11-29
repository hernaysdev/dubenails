import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactoRoutes } from './contacto-routing-module';
import { UsuarioComponent } from './usuario.component';



@NgModule({
  declarations: [
    UsuarioComponent
  ],
  imports: [
    CommonModule,
    ContactoRoutes
  ]
})
export class ContactoModule { }

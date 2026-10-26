import { ReactiveFormsModule } from '@angular/forms';
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
    ReactiveFormsModule,
    ContactoRoutes
  ]
})
export class ContactoModule { }

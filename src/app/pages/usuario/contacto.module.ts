import { ReactiveFormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactoRoutes } from './contacto-routing-module';
import { UsuarioComponent } from './usuario.component';
import { DatosPagoComponent } from './datos-pago/datos-pago.component';



@NgModule({
  declarations: [
    UsuarioComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ContactoRoutes,
    DatosPagoComponent
  ]
})
export class ContactoModule { }

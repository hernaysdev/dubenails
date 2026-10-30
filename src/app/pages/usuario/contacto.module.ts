import { ReactiveFormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactoRoutes } from './contacto-routing-module';
import { UsuarioComponent } from './usuario.component';
import { DatosPagoComponent } from './datos-pago/datos-pago.component';
import { HorarioAtencionComponent } from './horario-atencion/horario-atencion.component';



@NgModule({
  declarations: [
    UsuarioComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ContactoRoutes,
    DatosPagoComponent,
    HorarioAtencionComponent
  ]
})
export class ContactoModule { }

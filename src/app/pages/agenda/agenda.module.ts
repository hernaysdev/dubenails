import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { CalendarioComponent } from './components/calendario/calendario.component';
import { ModalRegisterComponent } from './components/modal-register/modal-register.component';
import { CancelarHoraComponent } from './components/cancelar-hora/cancelar-hora.component';
import { DetallesComponent } from './components/detalles/detalles.component';
import { PipesPipe } from 'src/app/pipes.pipe';
import { AgendaRoutes } from './agenda-routing';
import { AgendaComponent } from './agenda.component';
import { RegistrarUsuarioComponent } from './components/calendario/modalRegistrarUsuario/registrar-usuario/registrar-usuario.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { RegistroComponent } from 'src/app/shared/header/components/menu/components/registro/registro.component';


@NgModule({
  declarations: [
    AgendaComponent,
    CalendarioComponent,
    ModalRegisterComponent,
    CancelarHoraComponent,
    DetallesComponent,
    PipesPipe,
    RegistrarUsuarioComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AgendaRoutes,
    SharedModule
  ],
  exports :[
    CalendarioComponent
  ],
  schemas:[
    CUSTOM_ELEMENTS_SCHEMA
  ]
})
export class AgendaModule { }

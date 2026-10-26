import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ConfirmarComponent } from './confirmar.component';
import { PagoComponent } from 'src/app/shared/pago/pago.component';

@NgModule({
  declarations: [ConfirmarComponent],
  imports: [CommonModule, PagoComponent, RouterModule.forChild([{ path: '', component: ConfirmarComponent }])],
})
export class ConfirmarModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ConfirmarComponent } from './confirmar.component';
import { PagoComponent } from 'src/app/shared/pago/pago.component';
import { DineroPipe } from 'src/app/shared/pipes/dinero.pipe';

@NgModule({
  declarations: [ConfirmarComponent],
  imports: [CommonModule, PagoComponent, DineroPipe, RouterModule.forChild([{ path: '', component: ConfirmarComponent }])],
})
export class ConfirmarModule { }

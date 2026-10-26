import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { ReservarComponent } from './reservar.component';
import { PagoComponent } from 'src/app/shared/pago/pago.component';

@NgModule({
  declarations: [ReservarComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    PagoComponent,
    RouterModule.forChild([{ path: '', component: ReservarComponent }]),
  ],
})
export class ReservarModule { }

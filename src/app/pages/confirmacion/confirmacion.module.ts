import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmacionComponent } from './confirmacion.component';
import { ConfirmacionRoutes } from './confirmacion-routing';



@NgModule({
  declarations: [
    ConfirmacionComponent
  ],
  imports: [
    CommonModule,
    ConfirmacionRoutes
  ]
})
export class ConfirmacionModule { }

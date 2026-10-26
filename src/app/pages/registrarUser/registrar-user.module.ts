import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RegistrarUserRouting } from './registrar-user-routing-module';
import { RegistrarUserComponent } from './registrar-user.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { RouterModule } from '@angular/router';



@NgModule({
  declarations: [
    RegistrarUserComponent
  ],
  imports: [
    CommonModule,
    RegistrarUserRouting,
    SharedModule,
    RouterModule
  ]
})
export class RegistrarUserModule { }

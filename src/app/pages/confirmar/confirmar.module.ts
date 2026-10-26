import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ConfirmarComponent } from './confirmar.component';

@NgModule({
  declarations: [ConfirmarComponent],
  imports: [CommonModule, RouterModule.forChild([{ path: '', component: ConfirmarComponent }])],
})
export class ConfirmarModule { }

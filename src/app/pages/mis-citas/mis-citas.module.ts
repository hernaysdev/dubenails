import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MisCitasComponent } from './mis-citas.component';

@NgModule({
  declarations: [MisCitasComponent],
  imports: [CommonModule, RouterModule.forChild([{ path: '', component: MisCitasComponent }])],
})
export class MisCitasModule { }

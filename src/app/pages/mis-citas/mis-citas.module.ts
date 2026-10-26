import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MisCitasComponent } from './mis-citas.component';
import { AvisosAdminComponent } from './avisos-admin/avisos-admin.component';

@NgModule({
  declarations: [MisCitasComponent, AvisosAdminComponent],
  imports: [CommonModule, RouterModule.forChild([{ path: '', component: MisCitasComponent }])],
})
export class MisCitasModule { }

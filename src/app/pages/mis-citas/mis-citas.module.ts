import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MisCitasComponent } from './mis-citas.component';
import { AvisosAdminComponent } from './avisos-admin/avisos-admin.component';
import { CompartirLinkComponent } from 'src/app/shared/compartir-link/compartir-link.component';

@NgModule({
  declarations: [MisCitasComponent, AvisosAdminComponent],
  imports: [CommonModule, CompartirLinkComponent, RouterModule.forChild([{ path: '', component: MisCitasComponent }])],
})
export class MisCitasModule { }

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AgendaComponent } from './agenda.component';

const agendaRoutes: Routes = [
    {
       path: '', component : AgendaComponent
    }
];

@NgModule({
    imports: [RouterModule.forChild(agendaRoutes)],
    exports: [RouterModule]
})
export class AgendaRoutingModule { }
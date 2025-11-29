import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ConfirmacionComponent } from './confirmacion.component';

const confirmacionRoutes: Routes = [
    {
        path: 'confirmacion/:tokenUsuario/:mes/:dia/:hora',
        component: ConfirmacionComponent
    }
]

@NgModule({
    imports: [RouterModule.forChild(confirmacionRoutes)],
    exports: [RouterModule]
})

export class ConfirmacionRoutes { }
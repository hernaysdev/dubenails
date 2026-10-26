import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RegistrarUserComponent } from './registrar-user.component';


const contactoRoutes: Routes = [
    {
        path: '',
        component: RegistrarUserComponent
    }
]

@NgModule({
    imports: [RouterModule.forChild(contactoRoutes)],
    exports: [RouterModule]
})

export class RegistrarUserRouting { }
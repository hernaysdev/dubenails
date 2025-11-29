import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UsuarioComponent } from './usuario.component';

const contactoRoutes: Routes = [
    {
        path: 'contacto',
        component: UsuarioComponent
    }
]

@NgModule({
    imports: [RouterModule.forChild(contactoRoutes)],
    exports: [RouterModule]
})

export class ContactoRoutes { }
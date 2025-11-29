import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RecuperarClaveComponent } from '../shared/header/components/menu/components/recuperar-clave/recuperar-clave.component';



const pagesRoutes: Routes = [
  {
    path:'', redirectTo : '/home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadChildren: () => import('./gallery/gallery.module').then(m => m.GalleryModule)
  },
  {
    path: 'agenda',
    loadChildren: () => import('./agenda/agenda.module').then(m => m.AgendaModule)
  },
  {
    path: 'articulos',
    loadChildren: () => import('./home/home.module').then(m => m.HomeModule)
  },
  {
    path:'contacto',
    loadChildren : () => import('./usuario/contacto.module').then(m => m.ContactoModule)
  },
  {
    path:'confirmacion',
    loadChildren : () => import('./confirmacion/confirmacion.module').then(m => m.ConfirmacionModule)
  },
  {
    path:'giftcard',
    loadChildren : () => import('./giftcard/giftcard.module').then(m => m.GiftcardModule)
  },
  {
    path:'recuperar/:email',
    component: RecuperarClaveComponent
  }
];
@NgModule({
  imports: [RouterModule.forChild(pagesRoutes)],
  exports: [RouterModule]
})
export class PagesRouter { }

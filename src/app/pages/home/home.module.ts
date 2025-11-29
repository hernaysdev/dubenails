import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NoticiasComponent } from './components/noticias/noticias.component';
import { HomeComponent } from './home.component';
import { HomeRouter } from './home-routing';


@NgModule({
  declarations: [
    NoticiasComponent,
    HomeComponent
  ],
  imports: [
    CommonModule,
    HomeRouter
  ],
  exports:[
    NoticiasComponent,
    HomeComponent
  ]
})
export class HomeModule { }

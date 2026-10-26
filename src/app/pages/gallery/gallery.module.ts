import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GalleryRoutes } from './gallery-routing-module';
import { GalleryComponent } from './gallery.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MenuComponent } from './components/menu/menu.component';
import { RouterModule } from '@angular/router';


@NgModule({
  declarations: [
    GalleryComponent
  ],
  imports: [
    CommonModule,
    GalleryRoutes,
    ScrollingModule,
    MenuComponent,
    RouterModule
  ]
})
export class GalleryModule { }

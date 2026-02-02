import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { ProductosComponent } from './productos.component';
import { ProductoRouterModule } from './productos-routing.module';
import { UpdateProductosComponent } from './update-productos/update-productos.component';
import { SaveProductoComponent } from './save-producto/save-producto.component';
import { ListProductosComponent } from './list-productos/list-productos.component';
import { MenuComponent } from './menu/menu.component';
import { ReactiveFormsModule } from '@angular/forms';



@NgModule({
  declarations: [
    ProductosComponent,
    UpdateProductosComponent,
    SaveProductoComponent,
    ListProductosComponent,
    MenuComponent
  ],
  imports: [
    CommonModule,
    ProductoRouterModule,
    ReactiveFormsModule,
    NgxMaskDirective
  ],
  schemas:[
    CUSTOM_ELEMENTS_SCHEMA
  ],
  providers: [
    provideNgxMask()
  ]
})
export class ProductosModule { }

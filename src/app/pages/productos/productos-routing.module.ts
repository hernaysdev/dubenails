import { RouterModule, Routes } from "@angular/router";
import { ProductosComponent } from "./productos.component";
import { NgModule } from "@angular/core";
import { SaveProductoComponent } from "./save-producto/save-producto.component";
import { ListProductosComponent } from "./list-productos/list-productos.component";
import { UpdateProductosComponent } from "./update-productos/update-productos.component";


const productoRouter: Routes = [
    {
        path: '',
        component: ProductosComponent,
        children: [
            {
      path: '',
      redirectTo: 'list',
      pathMatch: 'full'
    },
    {
        path: 'save',
        component: SaveProductoComponent,

    },
    {
        path: 'list',
        component: ListProductosComponent
    },
    {
        path: 'update',
        component: UpdateProductosComponent
    }
        ]
    }
]

    @NgModule({
        imports: [RouterModule.forChild(productoRouter)],
        exports: [RouterModule]
    })

    export class ProductoRouterModule {}
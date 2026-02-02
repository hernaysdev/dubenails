import { Component } from '@angular/core';
import { ProductosService } from 'src/app/services/productos.service';

@Component({
  selector: 'app-productos',
  standalone: false,
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.scss'
})
export class ProductosComponent {

  constructor(
    private _productosService: ProductosService,
  ){
  }


  ngOnInit(): void {
    
    console.log('iniciando')
    this._productosService.getProductos().subscribe({
      next: (productos:any) => {
        console.log(productos)
      },
      err: (err:any) => {
        console.log('entrando al error ')
        console.log(err)

      }
    })
    
  }


  showList(){

  }

  saveProducto(){

  }

  updateProducto(){}

}

import { Component } from '@angular/core';
import { EventsService } from 'src/app/services/events.service';
import { ProductosService } from 'src/app/services/productos.service';

@Component({
  selector: 'app-list-productos',
  standalone: false,
  templateUrl: './list-productos.component.html',
  styleUrl: './list-productos.component.scss'
})
export class ListProductosComponent {
  dataSource: any

  constructor(
    private _productosService: ProductosService,
    private eventsService: EventsService
  ){

  }

  ngOnInit(): void {
    this.getProductos()
    
    
  }


  deleteProducto(id:any){
    this._productosService.delete(id).subscribe({
      next: (resp:any) => {
        this.eventsService.alertMessage('success','Servicio borrado!!!');
        this.getProductos()
      },
      error: (err:any) => {
        console.log(err)
        this.eventsService.alertMessage('error','No se pudo Borrar el servicio algo salio mal')
      }
    })
  }

  getProductos(){
this._productosService.getProductos().subscribe({
      next: (productos:any) => {
        console.log(productos)
        this.dataSource = productos
      },
      err: (err:any) => {
        console.log('entrando al error ')
        console.log(err)

      }
    })
  }

}

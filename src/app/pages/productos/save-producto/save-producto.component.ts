import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EventsService } from 'src/app/services/events.service';
import { ProductosService } from 'src/app/services/productos.service';

@Component({
  selector: 'app-save-producto',
  standalone: false,
  templateUrl: './save-producto.component.html',
  styleUrl: './save-producto.component.scss'
})
export class SaveProductoComponent {
  formProductos: FormGroup;
  constructor(
    public fb: FormBuilder,
    private _productosService: ProductosService,
    private eventsService: EventsService,
  ){
    this.formProductos = this.fb.group({
      nombre: ['', [Validators.required]],
      precio: ['', [Validators.required]],
      tiempo: ['', [Validators.required]]
    })

  }

  saveProducto(body:any){
    this._productosService.save(body).subscribe({
      next: (resp:any) => {
        this.eventsService.alertMessage('success', 'Registrado con Exito')
        this.formProductos.reset()
      },
      err: (err:any) => {
        console.log(err)
      }
    })
  

  }

  submit(){
    console.log(this.formProductos.value)
    this.saveProducto(this.formProductos.value)
  }

}

import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EventsService } from 'src/app/services/events.service';
import { ProductosService } from 'src/app/services/productos.service';
import { OPCIONES_DURACION } from '../duraciones';

@Component({
  selector: 'app-save-producto',
  standalone: false,
  templateUrl: './save-producto.component.html',
  styleUrl: './save-producto.component.scss'
})
export class SaveProductoComponent {
  formProductos: FormGroup;
  readonly duraciones = OPCIONES_DURACION;
  mensajeOk = '';
  mensajeError = '';
  guardando = false;
  constructor(
    public fb: FormBuilder,
    private _productosService: ProductosService,
    private eventsService: EventsService,
  ){
    this.formProductos = this.fb.group({
      nombre: ['', [Validators.required]],
      precio: [null, [Validators.required, Validators.min(1)]],
      tiempo: [1, [Validators.required]]
    })

  }

  saveProducto(body:any){
    this.guardando = true;
    this._productosService.save(body).subscribe({
      next: () => {
        this.guardando = false;
        this.mensajeOk = `"${body.nombre}" quedó creado.`;
        this.formProductos.reset({ nombre: '', precio: null, tiempo: 1 })
      },
      error: (msg: any) => {
        this.guardando = false;
        this.mensajeError = typeof msg === 'string' && msg ? msg : 'No pudimos crear el servicio.';
      }
    })
  

  }

  submit(){
    this.mensajeOk = ''; this.mensajeError = '';
    if (this.formProductos.invalid) { this.formProductos.markAllAsTouched(); this.mensajeError = 'Completa nombre, precio y duración.'; return; }
    const { nombre, precio, tiempo } = this.formProductos.value;
    this.saveProducto({ nombre: nombre.trim(), precio: Number(precio), tiempo: Number(tiempo) })
  }

}

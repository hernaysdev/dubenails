import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductosService } from 'src/app/services/productos.service';
import { formatoDuracion } from 'src/app/services/disponibilidad.service';
import { OPCIONES_DURACION } from '../duraciones';

interface Producto { _id: string; nombre: string; precio: number; tiempo: number; }

// Editar un servicio: sin ?id muestra la lista para elegir; con ?id el formulario con los datos actuales
@Component({
  selector: 'app-update-productos',
  standalone: false,
  templateUrl: './update-productos.component.html',
  styleUrl: './update-productos.component.scss'
})
export class UpdateProductosComponent implements OnInit {
  productos: Producto[] = [];
  producto: Producto | null = null;
  form: FormGroup;
  readonly duraciones = OPCIONES_DURACION;
  readonly duracion = formatoDuracion;
  cargando = true;
  guardando = false;
  mensajeOk = '';
  mensajeError = '';

  constructor(
    private productosService: ProductosService,
    private route: ActivatedRoute,
    private router: Router,
    fb: FormBuilder,
  ) {
    this.form = fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(80)]],
      precio: [null, [Validators.required, Validators.min(1)]],
      tiempo: [null, [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.productosService.getProductos().subscribe({
      next: (productos: Producto[]) => {
        this.productos = productos;
        this.cargando = false;
        this.route.queryParamMap.subscribe(params => this.elegir(params.get('id')));
      },
      error: () => { this.cargando = false; this.mensajeError = 'No pudimos cargar los servicios.'; }
    });
  }

  elegir(id: string | null) {
    this.mensajeOk = ''; this.mensajeError = '';
    this.producto = this.productos.find(p => p._id === id) || null;
    if (this.producto) {
      const { nombre, precio, tiempo } = this.producto;
      this.form.reset({ nombre: nombre.trim(), precio, tiempo: Number(tiempo) });
    }
  }

  editar(p: Producto) {
    this.router.navigate([], { relativeTo: this.route, queryParams: { id: p._id } });
  }

  volver() {
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  invalido(campo: string) {
    const c = this.form.get(campo);
    return !!c && c.invalid && c.touched;
  }

  guardar() {
    this.mensajeOk = ''; this.mensajeError = '';
    if (!this.producto) return;
    if (this.form.invalid) { this.form.markAllAsTouched(); this.mensajeError = 'Revisa los campos marcados.'; return; }
    const { nombre, precio, tiempo } = this.form.value;
    const cambios = { _id: this.producto._id, nombre: nombre.trim(), precio: Number(precio), tiempo: Number(tiempo) };
    this.guardando = true;
    this.productosService.update(cambios).subscribe({
      next: () => {
        this.guardando = false;
        Object.assign(this.producto!, cambios);
        this.mensajeOk = 'Cambios guardados. Ya se ven en la portada y en la reserva.';
      },
      error: (msg: string) => { this.guardando = false; this.mensajeError = msg; }
    });
  }
}

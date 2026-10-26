import { Component, OnInit } from '@angular/core';
import { ProductosService } from 'src/app/services/productos.service';
import { formatoDuracion, partesNombre } from 'src/app/services/disponibilidad.service';

interface Producto { _id: string; nombre: string; precio: number; tiempo: number; descripcion?: string; }

// Lista de servicios para la admin: mismas tarjetas que la portada, con precio, Editar y Eliminar
@Component({
  selector: 'app-list-productos',
  standalone: false,
  templateUrl: './list-productos.component.html',
  styleUrl: './list-productos.component.scss'
})
export class ListProductosComponent implements OnInit {
  dataSource: Producto[] = [];
  readonly duracion = formatoDuracion;
  readonly partes = partesNombre;
  cargando = true;
  confirmando: string | null = null;
  mensajeOk = '';
  mensajeError = '';

  constructor(private _productosService: ProductosService) { }

  ngOnInit(): void {
    this.getProductos();
  }

  getProductos() {
    this._productosService.getProductos().subscribe({
      next: (productos: Producto[]) => { this.dataSource = productos; this.cargando = false; },
      error: () => { this.cargando = false; this.mensajeError = 'No pudimos cargar los servicios.'; }
    });
  }

  deleteProducto(p: Producto) {
    this.mensajeOk = ''; this.mensajeError = '';
    this._productosService.delete(p._id).subscribe({
      next: () => {
        this.confirmando = null;
        this.dataSource = this.dataSource.filter(x => x._id !== p._id);
        this.mensajeOk = `"${p.nombre.trim()}" se eliminó. Ya no aparece en la portada ni en la reserva.`;
      },
      error: () => {
        this.confirmando = null;
        this.mensajeError = `No pudimos eliminar "${p.nombre.trim()}". Intenta de nuevo.`;
      }
    });
  }
}

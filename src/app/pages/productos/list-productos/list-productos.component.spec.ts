import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ListProductosComponent } from './list-productos.component';
import { ProductosService } from 'src/app/services/productos.service';

describe('ListProductosComponent (tarjetas)', () => {
  let c: ListProductosComponent;
  let servicio: jasmine.SpyObj<ProductosService>;
  const productos = [{ _id: 'p1', nombre: 'Extensión (Polygel / Builder) corto', precio: 28000, tiempo: 2 }, { _id: 'p2', nombre: 'Kapping', precio: 23000, tiempo: 1.5 }];

  beforeEach(() => {
    servicio = jasmine.createSpyObj('ProductosService', ['getProductos', 'delete']);
    servicio.getProductos.and.returnValue(of([...productos]));
    TestBed.configureTestingModule({ declarations: [ListProductosComponent], providers: [{ provide: ProductosService, useValue: servicio }] })
      .overrideTemplate(ListProductosComponent, '');
    c = TestBed.createComponent(ListProductosComponent).componentInstance;
    c.ngOnInit();
  });

  it('separa titulo y detalle como en la portada', () => {
    expect(c.partes(productos[0].nombre)).toEqual({ titulo: 'Extensión', detalle: 'Polygel / Builder · corto' });
  });

  it('eliminar quita la tarjeta y avisa en linea', () => {
    servicio.delete.and.returnValue(of('ok'));
    c.deleteProducto(c.dataSource[1]);
    expect(c.dataSource.map(p => p._id)).toEqual(['p1']);
    expect(c.mensajeOk).toContain('Kapping');
  });

  it('error al eliminar se muestra en linea y no quita la tarjeta', () => {
    servicio.delete.and.returnValue(throwError(() => ({ status: 500 })));
    c.deleteProducto(c.dataSource[1]);
    expect(c.dataSource.length).toBe(2);
    expect(c.mensajeError).toContain('No pudimos eliminar');
  });
});

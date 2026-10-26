import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { UpdateProductosComponent } from './update-productos.component';
import { ProductosService } from 'src/app/services/productos.service';

describe('UpdateProductosComponent (editar servicio)', () => {
  let c: UpdateProductosComponent;
  let servicio: jasmine.SpyObj<ProductosService>;
  let router: jasmine.SpyObj<Router>;
  const params = new BehaviorSubject(convertToParamMap({}));
  const productos = [
    { _id: 'p1', nombre: 'Kapping ', precio: 40, tiempo: 1.5 },
    { _id: 'p2', nombre: 'Pedicura', precio: 30, tiempo: 1 },
  ];

  beforeEach(() => {
    servicio = jasmine.createSpyObj('ProductosService', ['getProductos', 'update']);
    servicio.getProductos.and.returnValue(of(productos.map(p => ({ ...p }))));
    router = jasmine.createSpyObj('Router', ['navigate']);
    TestBed.configureTestingModule({
      declarations: [UpdateProductosComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: ProductosService, useValue: servicio },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { queryParamMap: params } },
      ],
    }).overrideTemplate(UpdateProductosComponent, '');
    c = TestBed.createComponent(UpdateProductosComponent).componentInstance;
    params.next(convertToParamMap({}));
    c.ngOnInit();
  });

  it('sin id muestra la lista para elegir', () => {
    expect(c.producto).toBeNull();
    expect(c.productos.length).toBe(2);
  });

  it('con id carga el formulario con los datos actuales', () => {
    params.next(convertToParamMap({ id: 'p1' }));
    expect(c.producto?._id).toBe('p1');
    expect(c.form.value).toEqual({ nombre: 'Kapping', precio: 40, tiempo: 1.5, descripcion: '' });
  });

  it('guardar envia solo nombre, precio y tiempo, y avisa', () => {
    params.next(convertToParamMap({ id: 'p1' }));
    servicio.update.and.returnValue(of({ msg: 'Servicio actualizado' }));
    c.form.patchValue({ nombre: ' Kapping gel ', precio: '45', tiempo: 2, descripcion: '  Incluye limado.  ' });
    c.guardar();
    expect(servicio.update).toHaveBeenCalledWith({ _id: 'p1', nombre: 'Kapping gel', precio: 45, tiempo: 2, descripcion: 'Incluye limado.' });
    expect(c.mensajeOk).toContain('guardados');
    expect(c.producto?.nombre).toBe('Kapping gel');
  });

  it('error de la API (nombre repetido) se muestra en el formulario', () => {
    params.next(convertToParamMap({ id: 'p1' }));
    servicio.update.and.returnValue(throwError(() => 'Ya existe un servicio con ese nombre.'));
    c.form.patchValue({ nombre: 'Pedicura' });
    c.guardar();
    expect(c.mensajeError).toContain('Ya existe');
  });

  it('formulario invalido no llama a la API', () => {
    params.next(convertToParamMap({ id: 'p1' }));
    c.form.patchValue({ precio: 0 });
    c.guardar();
    expect(servicio.update).not.toHaveBeenCalled();
    expect(c.mensajeError).toContain('Revisa');
  });
});

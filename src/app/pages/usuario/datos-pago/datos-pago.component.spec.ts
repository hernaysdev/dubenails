import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DatosPagoComponent } from './datos-pago.component';
import { ContenidoService } from 'src/app/services/contenido.service';

describe('DatosPagoComponent (admin)', () => {
  let servicio: jasmine.SpyObj<ContenidoService>;
  const crear = () => {
    TestBed.configureTestingModule({ imports: [DatosPagoComponent], providers: [{ provide: ContenidoService, useValue: servicio }] });
    const f = TestBed.createComponent(DatosPagoComponent);
    f.detectChanges();
    return f;
  };

  beforeEach(() => {
    servicio = jasmine.createSpyObj('ContenidoService', ['pagosAdmin', 'guardarPagos']);
    servicio.pagosAdmin.and.returnValue(of([
      { id: 'zelle', nombre: 'Zelle', activo: false, datos: '' },
      { id: 'binance', nombre: 'Binance Pay', activo: false, datos: '' },
    ]));
  });

  it('sin medios activos avisa que no se pide pago', () => {
    expect(crear().nativeElement.textContent).toContain('se confirman sin pago');
  });

  it('no deja guardar un medio activo sin datos', () => {
    const c = crear().componentInstance;
    c.alternar(c.medios[0]);
    c.guardar();
    expect(servicio.guardarPagos).not.toHaveBeenCalled();
    expect(c.mensajeError).toContain('Zelle');
  });

  it('guarda los medios', () => {
    servicio.guardarPagos.and.returnValue(of({}));
    const c = crear().componentInstance;
    c.alternar(c.medios[0]);
    c.medios[0].datos = 'pagos@dube.com';
    c.guardar();
    expect(servicio.guardarPagos).toHaveBeenCalled();
    expect(c.mensajeOk).toContain('piden la captura');
  });

  it('muestra el error de la API', () => {
    servicio.guardarPagos.and.returnValue(throwError(() => 'No se pudo'));
    const c = crear().componentInstance;
    c.guardar();
    expect(c.mensajeError).toBe('No se pudo');
  });

  it('agrega un medio nuevo (activo, sin id) y exige nombre', () => {
    const c = crear().componentInstance;
    c.agregar();
    expect(c.medios.length).toBe(3);
    expect(c.medios[2]).toEqual({ nombre: '', datos: '', activo: true });
    c.guardar();
    expect(servicio.guardarPagos).not.toHaveBeenCalled();
    expect(c.mensajeError).toContain('nombre');
  });

  it('no deja nombres repetidos', () => {
    const c = crear().componentInstance;
    c.medios[1].nombre = 'zelle';
    c.guardar();
    expect(c.mensajeError).toContain('mismo nombre');
  });

  it('elimina y al guardar toma los ids que asigna la API', () => {
    servicio.guardarPagos.and.returnValue(of({ medios: [{ id: 'cash-app-1a2b', nombre: 'Cash App', datos: '$dube', activo: true }] }));
    const c = crear().componentInstance;
    c.eliminar(0); c.eliminar(0);
    c.agregar();
    c.medios[0].nombre = 'Cash App'; c.medios[0].datos = '$dube';
    c.guardar();
    expect(servicio.guardarPagos).toHaveBeenCalledWith([{ nombre: 'Cash App', datos: '$dube', activo: true }]);
    expect(c.medios[0].id).toBe('cash-app-1a2b');
  });

  it('maximo 8 medios', () => {
    const c = crear().componentInstance;
    for (let i = 0; i < 10; i++) c.agregar();
    expect(c.medios.length).toBe(8);
  });
});

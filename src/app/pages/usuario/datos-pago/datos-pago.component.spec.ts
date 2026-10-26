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
});

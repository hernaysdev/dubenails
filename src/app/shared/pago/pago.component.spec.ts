import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PagoComponent, opcionesDePago } from './pago.component';

describe('PagoComponent', () => {
  let fixture: ComponentFixture<PagoComponent>;
  let c: PagoComponent;
  let emitido: any;
  const medios = [{ id: 'zelle', nombre: 'Zelle', datos: 'pagos@dube.com' }, { id: 'binance', nombre: 'Binance Pay', datos: 'ID 123' }];

  const elegirArchivo = (archivo: File) => {
    const input = fixture.nativeElement.querySelector('input[type=file]') as HTMLInputElement;
    const dt = new DataTransfer(); dt.items.add(archivo);
    input.files = dt.files;
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [PagoComponent] });
    fixture = TestBed.createComponent(PagoComponent);
    c = fixture.componentInstance;
    c.opciones = opcionesDePago(40, [15, 100]);
    c.medios = medios;
    c.total = 40;
    c.cambio.subscribe(v => emitido = v);
    emitido = undefined;
    c.ngOnChanges();
    fixture.detectChanges();
  });

  it('montos del 15% y del total', () => {
    expect(opcionesDePago(40, [15, 100])).toEqual([{ porcentaje: 15, monto: 6 }, { porcentaje: 100, monto: 40 }]);
    expect(fixture.nativeElement.textContent).toContain('$6');
    expect(fixture.nativeElement.textContent).toContain('$40');
  });

  it('emite el pago solo cuando estan los 3 datos', () => {
    c.elegirPorcentaje(15);
    expect(emitido).toBeNull();
    c.elegirMedio(medios[1]);
    expect(emitido).toBeNull();
    fixture.detectChanges();
    elegirArchivo(new File(['x'], 'pago.png', { type: 'image/png' }));
    expect(emitido).toEqual(jasmine.objectContaining({ porcentaje: 15, medio: 'binance' }));
    expect(emitido.archivo.name).toBe('pago.png');
    expect(fixture.nativeElement.textContent).toContain('El resto ($34)');
  });

  it('muestra los datos del medio elegido', () => {
    c.elegirMedio(medios[0]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.datos').textContent).toContain('pagos@dube.com');
  });

  it('rechaza archivos que no son imagen o muy pesados', () => {
    elegirArchivo(new File(['x'], 'pago.pdf', { type: 'application/pdf' }));
    expect(c.archivo).toBeNull();
    expect(c.error).toContain('imagen');
    const pesado = new File([new Uint8Array(11 * 1024 * 1024)], 'grande.jpg', { type: 'image/jpeg' });
    elegirArchivo(pesado);
    expect(c.archivo).toBeNull();
    expect(c.error).toContain('10 MB');
  });

  it('con un solo medio queda elegido', () => {
    c.medio = null; c.medios = [medios[0]];
    c.ngOnChanges();
    expect(c.medio as any).toEqual(medios[0]);
  });
});

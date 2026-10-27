import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PagoComponent, opcionesDePago } from './pago.component';

describe('PagoComponent', () => {
  let fixture: ComponentFixture<PagoComponent>;
  let c: PagoComponent;
  let emitido: any;
  const medios = [{ id: 'zelle', nombre: 'Zelle', datos: 'pagos@dube.com' }, { id: 'binance', nombre: 'Binance Pay', datos: 'ID 123' }];

  // elegir la foto es asincrono (se comprime en el navegador)
  const elegirArchivo = async (archivo: File) => {
    const input = fixture.nativeElement.querySelector('input[type=file]') as HTMLInputElement;
    const dt = new DataTransfer(); dt.items.add(archivo);
    input.files = dt.files;
    await c.elegirArchivo({ target: input } as any);
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

  it('emite el pago solo cuando estan los 3 datos', async () => {
    c.elegirPorcentaje(15);
    expect(emitido).toBeNull();
    c.elegirMedio(medios[1]);
    expect(emitido).toBeNull();
    fixture.detectChanges();
    await elegirArchivo(new File(['x'], 'pago.png', { type: 'image/png' }));
    expect(emitido).toEqual(jasmine.objectContaining({ porcentaje: 15, medio: 'binance' }));
    expect(emitido.archivo.name).toBe('pago.png');
    expect(fixture.nativeElement.textContent).toContain('El resto ($34)');
  });

  it('muestra los datos del medio elegido', () => {
    c.elegirMedio(medios[0]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.datos').textContent).toContain('pagos@dube.com');
  });

  it('rechaza lo que no es foto; una foto que no se pudo achicar y pesa mas de 15 MB tampoco', async () => {
    await elegirArchivo(new File(['x'], 'pago.pdf', { type: 'application/pdf' }));
    expect(c.archivo).toBeNull();
    expect(c.error).toContain('no es una foto');
    // contenido que el navegador no puede abrir: queda la original (16 MB) y se rechaza
    await elegirArchivo(new File([new Uint8Array(16 * 1024 * 1024)], 'grande.jpg', { type: 'image/jpeg' }));
    expect(c.archivo).toBeNull();
    expect(c.error).toContain('15 MB');
  });

  it('con un solo medio queda elegido', () => {
    c.medio = null; c.medios = [medios[0]];
    c.ngOnChanges();
    expect(c.medio as any).toEqual(medios[0]);
  });
});

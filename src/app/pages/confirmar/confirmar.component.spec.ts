import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ConfirmarComponent } from './confirmar.component';
import { ConfirmarService, ReservaPorConfirmar } from 'src/app/services/confirmar.service';

describe('ConfirmarComponent (link de la clienta)', () => {
  let servicio: jasmine.SpyObj<ConfirmarService>;
  const reserva: ReservaPorConfirmar = {
    estado: 'pendiente', nombre: 'Ana', servicio: 'Kapping', dia: 3, mes: 10, year: 2026, hora: 10.5, tramo: 12, valor: 40,
    vence: '', venceTexto: '16:30', pideOtroHorario: false, direccion: '50 Starling Ct', whatsapp: '+1 (678) 206 4296',
  };

  const crear = () => {
    TestBed.configureTestingModule({
      declarations: [ConfirmarComponent],
      providers: [
        { provide: ConfirmarService, useValue: servicio },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'tok123' } } } },
      ],
    });
    const fixture = TestBed.createComponent(ConfirmarComponent);
    fixture.detectChanges();
    return fixture;
  };
  const texto = (f: any) => f.nativeElement.textContent as string;
  const boton = (f: any, t: string) => [...f.nativeElement.querySelectorAll('button')].find((b: any) => b.textContent.includes(t)) as HTMLButtonElement;

  beforeEach(() => {
    servicio = jasmine.createSpyObj('ConfirmarService', ['ver', 'responder', 'subirPago']);
    servicio.ver.and.returnValue(of(reserva));
  });

  it('muestra la hora apartada y el plazo', () => {
    const f = crear();
    expect(servicio.ver).toHaveBeenCalledWith('tok123');
    expect(texto(f)).toContain('Hola Ana, te apartamos esta hora');
    expect(texto(f)).toContain('martes 3 de noviembre');
    expect(texto(f)).toContain('10:30 a 12:00');
    expect(texto(f)).toContain('antes de las 16:30');
  });

  it('confirmar', () => {
    servicio.responder.and.returnValue(of({ estado: 'confirmada' }));
    const f = crear();
    boton(f, 'Confirmar reserva').click();
    f.detectChanges();
    expect(servicio.responder).toHaveBeenCalledWith('tok123', 'aceptar');
    expect(texto(f)).toContain('Tu cita está confirmada');
    expect(boton(f, 'Confirmar reserva')).toBeUndefined();
  });

  it('no puedo: pide confirmacion antes de liberar', () => {
    servicio.responder.and.returnValue(of({ estado: 'rechazada' }));
    const f = crear();
    boton(f, 'No puedo asistir').click();
    f.detectChanges();
    expect(servicio.responder).not.toHaveBeenCalled();
    boton(f, 'Sí, no puedo').click();
    f.detectChanges();
    expect(servicio.responder).toHaveBeenCalledWith('tok123', 'rechazar');
    expect(texto(f)).toContain('Gracias por avisarnos');
  });

  it('otro horario: queda avisado y aun puede confirmar', () => {
    servicio.responder.and.returnValue(of({ estado: 'pendiente', pideOtroHorario: true }));
    const f = crear();
    boton(f, 'Necesito otro horario').click();
    f.detectChanges();
    expect(texto(f)).toContain('Le avisamos a DubeNails');
    expect(boton(f, 'Confirmar reserva')).toBeDefined();
  });

  it('vencida al confirmar (410) y link invalido (404)', () => {
    servicio.responder.and.returnValue(throwError(() => ({ status: 410 })));
    const f = crear();
    boton(f, 'Confirmar reserva').click();
    f.detectChanges();
    expect(texto(f)).toContain('El plazo para confirmar venció');

    TestBed.resetTestingModule();
    servicio.ver.and.returnValue(throwError(() => ({ status: 404 })));
    expect(texto(crear())).toContain('Este link ya no es válido');
  });

  describe('con pago', () => {
    const conPago = { ...reserva, pago: { requerido: true, estado: 'esperando-captura', opciones: [{ porcentaje: 15, monto: 6 }, { porcentaje: 100, monto: 40 }] }, medios: [{ id: 'zelle', nombre: 'Zelle', datos: 'x@y.com' }] };

    it('pide la captura en vez de "Confirmar reserva" y queda en revision', () => {
      servicio.ver.and.returnValue(of(conPago));
      servicio.subirPago.and.returnValue(of({ estado: 'en-revision', monto: 6 }));
      const f = crear();
      expect(f.nativeElement.querySelector('app-pago')).not.toBeNull();
      expect(boton(f, 'Confirmar reserva')).toBeUndefined();
      const c = f.componentInstance;
      c.pago = { porcentaje: 15, medio: 'zelle', archivo: new File(['x'], 'p.jpg', { type: 'image/jpeg' }) };
      c.enviarPago();
      f.detectChanges();
      expect(servicio.subirPago).toHaveBeenCalledWith('tok123', c.pago);
      expect(texto(f)).toContain('Recibimos tu pago');
    });

    it('si la admin lo rechazo muestra el motivo', () => {
      servicio.ver.and.returnValue(of({ ...conPago, pago: { ...conPago.pago, estado: 'rechazado', motivoRechazo: 'No se lee' } }));
      expect(texto(crear())).toContain('No pudimos validar tu pago: No se lee');
    });

    it('en revision: solo informa', () => {
      servicio.ver.and.returnValue(of({ ...conPago, estado: 'en-revision' }));
      const f = crear();
      expect(texto(f)).toContain('Recibimos tu pago');
      expect(f.nativeElement.querySelector('app-pago')).toBeNull();
    });
  });
});

import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MisCitasComponent, MiCita } from './mis-citas.component';
import { AgendaService } from 'src/app/services/agenda.service';

describe('MisCitasComponent', () => {
  let c: MisCitasComponent;
  let agenda: jasmine.SpyObj<AgendaService>;
  let router: jasmine.SpyObj<Router>;
  const cita: MiCita = { id: 'c1', servicio: 'Kapping', servicioId: 'k1', dia: 3, mes: 10, year: 2026, hora: 14, tramo: 15.5, valor: 40, puedeModificar: true };

  beforeEach(() => {
    agenda = jasmine.createSpyObj('AgendaService', ['misCitas', 'cancelarMiCita', 'reprogramarMiCita', 'enviarLink', 'verCaptura', 'aprobarPago', 'rechazarPago']);
    agenda.misCitas.and.returnValue(of({ citas: [cita, { ...cita, id: 'c2', dia: 4 }], esAdmin: false }));
    router = jasmine.createSpyObj('Router', ['navigate']);
    TestBed.configureTestingModule({
      declarations: [MisCitasComponent],
      providers: [{ provide: AgendaService, useValue: agenda }, { provide: Router, useValue: router }],
    }).overrideTemplate(MisCitasComponent, '');
    c = TestBed.createComponent(MisCitasComponent).componentInstance;
    c.ngOnInit();
  });

  it('carga las proximas citas', () => {
    expect(c.citas.length).toBe(2);
    expect(c.fecha(cita)).toBe('martes 3 de noviembre');
  });

  it('cancelar la quita de la lista y avisa', () => {
    agenda.cancelarMiCita.and.returnValue(of({ msg: 'Cita cancelada' }));
    c.confirmando = 'c1';
    c.cancelar(cita);
    expect(agenda.cancelarMiCita).toHaveBeenCalledWith('c1');
    expect(c.citas.map(x => x.id)).toEqual(['c2']);
    expect(c.aviso).toContain('3 de noviembre');
    expect(c.confirmando).toBeNull();
  });

  it('si la API rechaza (menos de 24 h), muestra el motivo y no la quita', () => {
    agenda.cancelarMiCita.and.returnValue(throwError(() => 'Faltan menos de 24 horas para tu cita. Para cambiarla, escríbenos.'));
    c.cancelar(cita);
    expect(c.error).toContain('24 horas');
    expect(c.citas.length).toBe(2);
  });

  it('reprogramar abre el asistente con el servicio y la cita', () => {
    c.reprogramar(cita);
    expect(router.navigate).toHaveBeenCalledWith(['/reservar'], { queryParams: { servicio: 'k1', reprogramar: 'c1' } });
  });

  it('admin: titulo de todas las reservas, agrupadas por dia, y aviso con el nombre de la clienta', () => {
    agenda.misCitas.and.returnValue(of({ esAdmin: true, citas: [
      { ...cita, clienta: 'Ana', sinCuenta: false },
      { ...cita, id: 'c2', hora: 16, clienta: 'Carla', sinCuenta: true },
      { ...cita, id: 'c3', dia: 4, clienta: 'Bea' },
    ] }));
    c.cargar();
    expect(c.esAdmin).toBeTrue();
    expect(c.dias.map(d => [d.fecha, d.citas.length])).toEqual([['martes 3 de noviembre', 2], ['miércoles 4 de noviembre', 1]]);
    agenda.cancelarMiCita.and.returnValue(of({}));
    c.cancelar(c.citas[1]);
    expect(c.aviso).toContain('Carla');
    expect(c.dias[0].citas.length).toBe(1);
  });

  describe('link para confirmar (admin)', () => {
    const link = { url: 'https://dubenails.com/confirmar/abc', vence: '2026-11-03T20:30:00.000Z', venceTexto: '16:30', mensaje: 'Hola', whatsapp: 'https://wa.me/?text=Hola', correoEnviado: false };

    it('crear el link marca la cita por confirmar y deja el panel para compartir', () => {
      agenda.enviarLink.and.returnValue(of(link));
      const x = { ...cita, clienta: 'Ana' };
      c.apartando = 'c1';
      c.enviarLink(x);
      expect(agenda.enviarLink).toHaveBeenCalledWith('c1');
      expect(x.porConfirmar).toBeTrue();
      expect(x.venceTexto).toBe('16:30');
      expect(c.linkDe['c1']).toEqual(link);
      expect(c.apartando).toBeNull();
    });

    it('si falla, muestra el motivo', () => {
      agenda.enviarLink.and.returnValue(throwError(() => 'Esa cita ya pasó.'));
      c.enviarLink(cita);
      expect(c.error).toBe('Esa cita ya pasó.');
      expect(c.linkDe['c1']).toBeUndefined();
    });

    it('al llegar desde la agenda con un link nuevo, lo muestra', () => {
      history.replaceState({ linkNuevo: { citaId: 'c9', link } }, '');
      const otro = TestBed.createComponent(MisCitasComponent).componentInstance;
      otro.ngOnInit();
      expect(otro.linkDe['c9']).toEqual(link);
      history.replaceState({}, '');
    });
  });

  describe('revision del pago (admin)', () => {
    const conPago = (): MiCita => ({ ...cita, clienta: 'Ana', porConfirmar: true, pago: { estado: 'en-revision', porcentaje: 15, monto: 6, medio: 'Zelle', motivoRechazo: '', tieneCaptura: true } });
    beforeEach(() => { c.esAdmin = true; agenda.verCaptura.and.returnValue(of(new Blob(['x'], { type: 'image/jpeg' }))); });

    it('texto del estado del pago', () => {
      expect(c.textoPago(conPago())).toBe('Pago para revisar · 15% · $6 · Zelle');
      c.esAdmin = false;
      expect(c.textoPago(conPago())).toContain('te avisaremos');
    });

    it('abre la captura y aprueba: la cita queda confirmada', () => {
      agenda.aprobarPago.and.returnValue(of({}));
      const x = conPago();
      c.abrirRevision(x);
      expect(c.captura).toMatch(/^blob:/);
      c.aprobarPago();
      expect(agenda.aprobarPago).toHaveBeenCalledWith('c1');
      expect(x.pago!.estado).toBe('aprobado');
      expect(x.porConfirmar).toBeFalse();
      expect(c.revisando).toBeNull();
      expect(c.aviso).toContain('quedó confirmada');
    });

    it('rechazar pide motivo y avisa hasta cuando puede subir otra', () => {
      agenda.rechazarPago.and.returnValue(of({ venceTexto: '20:15', correoEnviado: true }));
      const x = conPago();
      c.abrirRevision(x);
      c.rechazarPago();
      expect(agenda.rechazarPago).not.toHaveBeenCalled();
      expect(c.errorPago).toContain('motivo');
      c.motivo = 'El monto no coincide';
      c.rechazarPago();
      expect(agenda.rechazarPago).toHaveBeenCalledWith('c1', 'El monto no coincide');
      expect(x.pago!.estado).toBe('rechazado');
      expect(c.aviso).toContain('20:15');
    });
  });
});

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
    agenda = jasmine.createSpyObj('AgendaService', ['misCitas', 'cancelarMiCita', 'reprogramarMiCita']);
    agenda.misCitas.and.returnValue(of([cita, { ...cita, id: 'c2', dia: 4 }]));
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
});

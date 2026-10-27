import { BehaviorSubject, Subject } from 'rxjs';
import { NovedadesService } from 'src/app/services/novedades.service';
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { CalendarioComponent } from './calendario.component';
import { AgendaService } from 'src/app/services/agenda.service';
import { SharedService } from 'src/app/services/shared.service';
import { EventsService } from 'src/app/services/events.service';

describe('CalendarioComponent (agenda con year)', () => {
  let component: CalendarioComponent;
  let shared: SharedService;
  let agendaService: jasmine.SpyObj<AgendaService>;

  // "hoy" = 15 de diciembre de 2026
  const crear = (hoy = new Date(2026, 11, 15)) => {
    jasmine.clock().install();
    jasmine.clock().mockDate(hoy);
    agendaService = jasmine.createSpyObj('AgendaService', ['getTotalValorMes', 'getUsersMes']);
    agendaService.getTotalValorMes.and.returnValue(of(0) as any);
    agendaService.getUsersMes.and.returnValue(of([]) as any);

    TestBed.configureTestingModule({
      declarations: [CalendarioComponent],
      imports: [ReactiveFormsModule],
      providers: [{ provide: NovedadesService, useValue: { cambios$: new Subject(), citasNuevas$: new BehaviorSubject(0), muroNuevos$: new BehaviorSubject(0), aviso$: new Subject(), marcarAgendaVista: () => {} } }, 
        { provide: AgendaService, useValue: agendaService },
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigateByUrl']) },
        SharedService,
        EventsService,
      ],
    }).overrideTemplate(CalendarioComponent, '');

    shared = TestBed.inject(SharedService);
    component = TestBed.createComponent(CalendarioComponent).componentInstance;
    component.fechas();
  };

  afterEach(() => jasmine.clock().uninstall());

  it('arranca en el mes y year actuales', () => {
    crear();
    expect(component.mesAgenda).toBe(11);
    expect(component.year).toBe(2026);
    expect(component.dias.length).toBe(31);
  });

  it('avanzar desde diciembre pasa a enero del year siguiente', () => {
    crear();
    component.dateNext(1);
    expect(component.mesAgenda).toBe(0);
    expect(component.year).toBe(2027);
    expect(component.infoYear).toBe('2027');
  });

  it('volver desde enero regresa a diciembre del year anterior', () => {
    crear();
    component.dateNext(1);
    component.dateNext(0);
    expect(component.mesAgenda).toBe(11);
    expect(component.year).toBe(2026);
  });

  it('puede avanzar varios meses y recorrer 2027', () => {
    crear();
    for (let i = 0; i < 13; i++) component.dateNext(1);
    expect(component.mesAgenda).toBe(0);
    expect(component.year).toBe(2028);
  });

  it('el dia enviado al detalle lleva el year que se esta viendo', () => {
    crear();
    component.dateNext(1);
    component.modalAgenda(20, 0 as any, 'miércoles', 15, component.mesActual, component.mesAgenda);
    expect(component.dia).toEqual(jasmine.objectContaining({ day: 20, month: 0, year: 2027 }));
  });

  it('bloquea dias pasados del mes en curso a una clienta', () => {
    crear();
    const r = component.modalAgenda(10, 11 as any, 'jueves', 15, component.mesActual, component.mesAgenda);
    expect(r).toBeFalse();
    expect(component.desabilitarDia).toBeTrue();
  });

  it('NO bloquea el mismo mes del year siguiente (antes se bloqueaba)', () => {
    crear(new Date(2026, 0, 15)); // 15 de enero de 2026
    for (let i = 0; i < 12; i++) component.dateNext(1); // enero 2027
    expect(component.year).toBe(2027);
    expect(component.mesAgenda).toBe(component.mesActual);
    component.desabilitarDia = false;
    component.modalAgenda(10, 0 as any, 'lunes', 15, component.mesActual, component.mesAgenda);
    expect(component.desabilitarDia).toBeFalse();
    expect(component.showModalDetalle).toBeTrue();
  });

  it('domingo siempre bloqueado para clientas', () => {
    crear();
    component.dateNext(1);
    expect(component.modalAgenda(3, 0 as any, 'domingo', 15, component.mesActual, component.mesAgenda)).toBeFalse();
  });

  it('el rol que llega despues de iniciar (recarga de /agenda) se aplica y carga totales del year', () => {
    crear();
    component.ngOnInit();
    expect(component.rolUsuario).toBe('');
    expect(agendaService.getTotalValorMes).not.toHaveBeenCalled();

    shared.setRolUser({ rol: 'admin' } as any);
    expect(component.rolUsuario).toBe('admin');
    expect(agendaService.getTotalValorMes).toHaveBeenCalledWith(11, 2026);
  });

  it('al cerrar sesion el rol vuelve a vacio', () => {
    crear();
    component.ngOnInit();
    shared.setRolUser({ rol: 'admin' } as any);
    shared.setRolUser('');
    expect(component.rolUsuario).toBe('');
  });
});

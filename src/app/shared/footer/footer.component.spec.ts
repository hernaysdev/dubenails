import { BehaviorSubject, Subject } from 'rxjs';
import { NovedadesService } from 'src/app/services/novedades.service';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { FooterComponent } from './footer.component';
import { EventsService } from 'src/app/services/events.service';
import { SharedService } from 'src/app/services/shared.service';

describe('FooterComponent (pestaña Agenda/Reservar)', () => {
  it('clientas y visitas van a /reservar; la admin a su agenda', () => {
    TestBed.configureTestingModule({
      declarations: [FooterComponent],
      providers: [{ provide: NovedadesService, useValue: { cambios$: new Subject(), citasNuevas$: new BehaviorSubject(0), muroNuevos$: new BehaviorSubject(0), aviso$: new Subject(), marcarAgendaVista: () => {} } }, EventsService, SharedService, { provide: Router, useValue: {} }],
    }).overrideTemplate(FooterComponent, '');
    const shared = TestBed.inject(SharedService);
    const c = TestBed.createComponent(FooterComponent).componentInstance;
    c.ngOnInit();
    expect(c.esAdmin).toBeFalse();                 // sin sesion
    shared.setRolUser({ rol: 'user' } as any);
    expect(c.esAdmin).toBeFalse();
    shared.setRolUser({ rol: 'admin' } as any);
    expect(c.esAdmin).toBeTrue();
    shared.setRolUser('');                         // cierra sesion
    expect(c.esAdmin).toBeFalse();
  });
});

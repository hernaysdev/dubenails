import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ReservarComponent } from './reservar.component';
import { DisponibilidadService, formatoDuracion, formatoHora } from 'src/app/services/disponibilidad.service';
import { AgendaService } from 'src/app/services/agenda.service';
import { UsuariosService } from 'src/app/services/usuarios.service';

describe('ReservarComponent (reserva guiada)', () => {
  let c: ReservarComponent;
  let disp: jasmine.SpyObj<DisponibilidadService>;
  let agenda: jasmine.SpyObj<AgendaService>;
  let usuarios: jasmine.SpyObj<UsuariosService>;
  const kapping = { id: 'k1', nombre: 'Kapping', precio: 40, duracion: 1.5 };

  const crear = (servicioQuery: string | null = null, conSesion = true) => {
    disp = jasmine.createSpyObj('DisponibilidadService', ['servicios', 'dias', 'horas']);
    disp.servicios.and.returnValue(of([kapping]));
    disp.dias.and.returnValue(of([{ dia: 1, libres: 0 }, { dia: 2, libres: 5 }]));
    disp.horas.and.returnValue(of([9, 9.5, 14]));
    agenda = jasmine.createSpyObj('AgendaService', ['recibirDatos']);
    usuarios = jasmine.createSpyObj('UsuariosService', ['getUsuario']);
    usuarios.getUsuario.and.returnValue(of({ id: 'u1', nombre: 'ana', telefono: 5551234, correo: 'ana@test.com' }) as any);
    if (conSesion) localStorage.setItem('token', 'tok'); else localStorage.removeItem('token');

    TestBed.configureTestingModule({
      declarations: [ReservarComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: DisponibilidadService, useValue: disp },
        { provide: AgendaService, useValue: agenda },
        { provide: UsuariosService, useValue: usuarios },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(servicioQuery ? { servicio: servicioQuery } : {}) } } },
      ],
    }).overrideTemplate(ReservarComponent, '');
    c = TestBed.createComponent(ReservarComponent).componentInstance;
    c.ngOnInit();
  };

  afterEach(() => localStorage.removeItem('token'));

  it('recorre servicio -> dia -> hora -> datos pidiendo la disponibilidad correcta', () => {
    crear();
    expect(c.paso).toBe('servicio');
    c.elegirServicio(kapping);
    expect(c.paso).toBe('dia');
    expect(disp.dias).toHaveBeenCalledWith('k1', c.mes, c.year);
    c.elegirDia({ dia: 1, libres: 0 });           // sin cupo: no avanza
    expect(c.paso).toBe('dia');
    c.elegirDia({ dia: 2, libres: 5 });
    expect(c.paso).toBe('hora');
    expect(disp.horas).toHaveBeenCalledWith('k1', 2, c.mes, c.year);
    c.elegirHora(14);
    expect(c.paso).toBe('datos');
  });

  it('el servicio de la portada (?servicio=) salta directo al dia', () => {
    crear('k1');
    expect(c.servicio?.id).toBe('k1');
    expect(c.paso).toBe('dia');
  });

  it('con sesion, completa nombre y telefono del perfil y confirma con los datos correctos', () => {
    crear();
    agenda.recibirDatos.and.returnValue(of('agenda registrada con exito!!!'));
    c.elegirServicio(kapping); c.elegirDia({ dia: 2, libres: 5 }); c.elegirHora(14);
    expect(c.form.value).toEqual({ nombre: 'ana', telefono: '5551234' });
    c.confirmar();
    expect(agenda.recibirDatos).toHaveBeenCalledWith(jasmine.objectContaining({
      nombre: 'ana', dia: '2', horaNueva: 14, servicio: 'Kapping', horaServicio: 1.5, mes: c.mes, year: c.year, id: 'u1', correo: 'ana@test.com', precio: 40,
    }));
    expect(c.paso).toBe('listo');
  });

  it('sin sesion no confirma (se muestra el login en el paso de datos)', () => {
    crear(null, false);
    c.elegirServicio(kapping); c.elegirDia({ dia: 2, libres: 5 }); c.elegirHora(14);
    expect(c.usuario).toBeNull();
    c.confirmar();
    expect(agenda.recibirDatos).not.toHaveBeenCalled();
  });

  it('al iniciar sesion en el paso de datos, carga el perfil sin salir de la reserva', () => {
    crear(null, false);
    c.elegirServicio(kapping); c.elegirDia({ dia: 2, libres: 5 }); c.elegirHora(14);
    localStorage.setItem('token', 'tok');
    c.cargarUsuario();
    expect(c.usuario?.id).toBe('u1');
    expect(c.paso).toBe('datos');
  });

  it('si la hora ya fue tomada, vuelve a elegir hora con la lista actualizada', () => {
    crear();
    agenda.recibirDatos.and.returnValue(throwError(() => 'Ese horario ya está tomado. Elige otra hora.'));
    c.elegirServicio(kapping); c.elegirDia({ dia: 2, libres: 5 }); c.elegirHora(9);
    disp.horas.calls.reset();
    c.confirmar();
    expect(c.paso).toBe('hora');
    expect(c.error).toContain('tomado');
    expect(disp.horas).toHaveBeenCalled();
  });

  it('no deja ir a meses pasados ni a mas de 3 meses', () => {
    crear();
    c.elegirServicio(kapping);
    expect(c.puedeRetroceder).toBeFalse();
    c.cambiarMes(1); c.cambiarMes(1); c.cambiarMes(1);
    expect(c.puedeAvanzar).toBeFalse();
  });

  it('formatos de hora y duracion', () => {
    expect(formatoHora(9.5)).toBe('09:30');
    expect(formatoHora(14)).toBe('14:00');
    expect(formatoDuracion(1.5)).toBe('1 h 30 min');
    expect(formatoDuracion(0.5)).toBe('30 min');
    expect(formatoDuracion(2)).toBe('2 h');
  });
});

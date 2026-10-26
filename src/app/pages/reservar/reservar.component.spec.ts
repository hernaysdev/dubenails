import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
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
  const pedicura = { id: 'p1', nombre: 'Pedicura', precio: 30, duracion: 1 };
  // marca los servicios y continua al calendario
  const elegir = (...servicios: any[]) => { servicios.forEach(s => c.alternarServicio(s)); c.continuar(); };

  let router: jasmine.SpyObj<Router>;
  const crear = (servicioQuery: string | null = null, conSesion = true, reprogramar: string | null = null, marcar: string | null = null) => {
    disp = jasmine.createSpyObj('DisponibilidadService', ['servicios', 'dias', 'horas']);
    disp.servicios.and.returnValue(of([kapping, pedicura]));
    disp.dias.and.returnValue(of([{ dia: 1, libres: 0 }, { dia: 2, libres: 5 }]));
    disp.horas.and.returnValue(of([9, 9.5, 14]));
    agenda = jasmine.createSpyObj('AgendaService', ['recibirDatos', 'reprogramarMiCita']);
    router = jasmine.createSpyObj('Router', ['navigate']);
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
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({ ...(servicioQuery ? { servicio: servicioQuery } : {}), ...(reprogramar ? { reprogramar } : {}), ...(marcar ? { marcar } : {}) }) } } },
      ],
    }).overrideTemplate(ReservarComponent, '');
    c = TestBed.createComponent(ReservarComponent).componentInstance;
    c.ngOnInit();
  };

  afterEach(() => localStorage.removeItem('token'));

  it('recorre servicio -> dia -> hora -> datos pidiendo la disponibilidad correcta', () => {
    crear();
    expect(c.paso).toBe('servicio');
    c.continuar();                                 // sin servicios: no avanza
    expect(c.paso).toBe('servicio');
    elegir(kapping);
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
    expect(c.elegidos.map(s => s.id)).toEqual(['k1']);
    expect(c.paso).toBe('dia');
  });

  it('con sesion, completa nombre y telefono del perfil y confirma con los datos correctos', () => {
    crear();
    agenda.recibirDatos.and.returnValue(of('agenda registrada con exito!!!'));
    elegir(kapping); c.elegirDia({ dia: 2, libres: 5 }); c.elegirHora(14);
    expect(c.form.value).toEqual({ nombre: 'ana', telefono: '5551234' });
    c.confirmar();
    expect(agenda.recibirDatos).toHaveBeenCalledWith(jasmine.objectContaining({
      nombre: 'ana', dia: '2', horaNueva: 14, servicio: 'Kapping', horaServicio: 1.5, mes: c.mes, year: c.year, id: 'u1', correo: 'ana@test.com', precio: 40,
    }));
    expect(c.paso).toBe('listo');
  });

  it('sin sesion no confirma (se muestra el login en el paso de datos)', () => {
    crear(null, false);
    elegir(kapping); c.elegirDia({ dia: 2, libres: 5 }); c.elegirHora(14);
    expect(c.usuario).toBeNull();
    c.confirmar();
    expect(agenda.recibirDatos).not.toHaveBeenCalled();
  });

  it('al iniciar sesion en el paso de datos, carga el perfil sin salir de la reserva', () => {
    crear(null, false);
    elegir(kapping); c.elegirDia({ dia: 2, libres: 5 }); c.elegirHora(14);
    localStorage.setItem('token', 'tok');
    c.cargarUsuario();
    expect(c.usuario?.id).toBe('u1');
    expect(c.paso).toBe('datos');
  });

  it('si la hora ya fue tomada, vuelve a elegir hora con la lista actualizada', () => {
    crear();
    agenda.recibirDatos.and.returnValue(throwError(() => 'Ese horario ya está tomado. Elige otra hora.'));
    elegir(kapping); c.elegirDia({ dia: 2, libres: 5 }); c.elegirHora(9);
    disp.horas.calls.reset();
    c.confirmar();
    expect(c.paso).toBe('hora');
    expect(c.error).toContain('tomado');
    expect(disp.horas).toHaveBeenCalled();
  });

  it('no deja ir a meses pasados ni a mas de 3 meses', () => {
    crear();
    elegir(kapping);
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

  it('modo reprogramar: confirma el cambio de la cita en vez de crear una nueva', () => {
    crear('k1', true, 'cita-9');
    agenda.reprogramarMiCita.and.returnValue(of({ msg: 'Cita reprogramada' }));
    c.elegirDia({ dia: 2, libres: 5 }); c.elegirHora(14);
    c.confirmar();
    expect(agenda.recibirDatos).not.toHaveBeenCalled();
    expect(agenda.reprogramarMiCita).toHaveBeenCalledWith('cita-9', { dia: 2, mes: c.mes, year: c.year, hora: 14 });
    expect(c.paso).toBe('listo');
    c.reservarOtra();
    expect(router.navigate).toHaveBeenCalledWith(['/mis-citas']);
  });

  describe('varios servicios en la misma cita', () => {
    it('suma duracion y precio y pide disponibilidad con todos', () => {
      crear();
      elegir(kapping, pedicura);
      expect(c.nombreServicios).toBe('Kapping + Pedicura');
      expect(c.duracionTotal).toBe(2.5);
      expect(c.precioTotal).toBe(70);
      expect(disp.dias).toHaveBeenCalledWith('k1,p1', c.mes, c.year);
      c.elegirDia({ dia: 2, libres: 5 });
      expect(disp.horas).toHaveBeenCalledWith('k1,p1', 2, c.mes, c.year);
    });

    it('al confirmar manda los ids (la API calcula el precio)', () => {
      crear();
      agenda.recibirDatos.and.returnValue(of('ok'));
      elegir(kapping, pedicura); c.elegirDia({ dia: 2, libres: 5 }); c.elegirHora(14);
      c.confirmar();
      expect(agenda.recibirDatos).toHaveBeenCalledWith(jasmine.objectContaining({
        servicio: 'Kapping + Pedicura', horaServicio: 2.5, precio: 70, servicioIds: ['k1', 'p1'],
      }));
    });

    it('tocar de nuevo un servicio lo quita; maximo 4', () => {
      crear();
      c.alternarServicio(kapping); c.alternarServicio(pedicura); c.alternarServicio(kapping);
      expect(c.elegidos.map(s => s.id)).toEqual(['p1']);
      for (let i = 0; i < 4; i++) c.alternarServicio({ id: 'x' + i, nombre: 'X' + i, precio: 1, duracion: 0.5 });
      expect(c.elegidos.length).toBe(4);
      expect(c.error).toContain('hasta 4');
    });

    it('reprogramar una cita con varios servicios (?servicio=k1,p1) los trae elegidos', () => {
      crear('k1,p1', true, 'cita-9');
      expect(c.elegidos.map(s => s.id)).toEqual(['k1', 'p1']);
      expect(c.paso).toBe('dia');
    });
  });

  it('desde el detalle de la portada (?marcar=) queda marcado en el paso 1 y puede sumar otros', () => {
    crear(null, true, null, 'k1');
    expect(c.paso).toBe('servicio');
    expect(c.elegidos.map(s => s.id)).toEqual(['k1']);
    expect(disp.dias).not.toHaveBeenCalled();
    c.alternarServicio(pedicura);
    c.continuar();
    expect(disp.dias).toHaveBeenCalledWith('k1,p1', c.mes, c.year);
  });
});

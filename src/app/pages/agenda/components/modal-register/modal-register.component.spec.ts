import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, Subject, throwError } from 'rxjs';

import { horasDelDia, ModalRegisterComponent } from './modal-register.component';
import { ContenidoService } from 'src/app/services/contenido.service';
import { AgendaService } from 'src/app/services/agenda.service';
import { EventsService } from 'src/app/services/events.service';
import { SharedService } from 'src/app/services/shared.service';
import { UsuariosService } from 'src/app/services/usuarios.service';
import { ProductosService } from 'src/app/services/productos.service';
import { Router } from '@angular/router';

describe('ModalRegisterComponent (year al agendar)', () => {
  let component: ModalRegisterComponent;
  let agendaService: jasmine.SpyObj<AgendaService>;
  let router: jasmine.SpyObj<Router>;
  let usuariosService: jasmine.SpyObj<UsuariosService>;
  const contenido = new ContenidoService({} as any);

  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2026, 11, 20)); // 20 de diciembre de 2026
    agendaService = jasmine.createSpyObj('AgendaService', ['getDatosDay', 'recibirDatos', 'agendarPorConfirmar']);
    agendaService.getDatosDay.and.returnValue(of('No se encontraron registros.'));
    agendaService.recibirDatos.and.returnValue(of('ok'));
    router = jasmine.createSpyObj('Router', ['navigate']);
    usuariosService = jasmine.createSpyObj('UsuariosService', ['findUsuarioExpress']);
    const events = jasmine.createSpyObj('EventsService', ['alertMessage'], {
      successDatos: { emit: () => {} }, setValorMontoTotal: { emit: () => {} },
    });

    TestBed.configureTestingModule({
      declarations: [ModalRegisterComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: AgendaService, useValue: agendaService },
        { provide: EventsService, useValue: events },
        { provide: SharedService, useValue: jasmine.createSpyObj('SharedService', ['setDataAgenda']) },
        { provide: UsuariosService, useValue: usuariosService },
        { provide: ProductosService, useValue: {} },
        { provide: Router, useValue: router },
        { provide: ContenidoService, useValue: contenido },
      ],
    }).overrideTemplate(ModalRegisterComponent, '');

    component = TestBed.createComponent(ModalRegisterComponent).componentInstance;
    component.servicioSelected = { precio: 40 } as any;
    spyOn(component as any, 'setDataCliente').and.stub();
  });

  afterEach(() => jasmine.clock().uninstall());

  it('agendar en enero desde diciembre guarda el year del calendario (2027), no el actual', async () => {
    component.dia = { day: 5, month: 0, diaName: 'martes', year: 2027 };
    await component.traerData(10, 'Ana', 'Kapping', 5, 2, '', 0, '');
    expect(agendaService.recibirDatos).toHaveBeenCalledWith(jasmine.objectContaining({ mes: 0, year: 2027, precio: 40 }));
  });

  it('si el dia no trae year usa el year actual', async () => {
    component.dia = { day: 22, month: 11, diaName: 'martes' };
    await component.traerData(10, 'Ana', 'Kapping', 22, 2, '', 11, '');
    expect(agendaService.recibirDatos).toHaveBeenCalledWith(jasmine.objectContaining({ mes: 11, year: 2026 }));
  });

  it('no agenda si la hora choca con otra del mismo dia', async () => {
    agendaService.getDatosDay.and.returnValue(of([{ hora: 10, tramo: 12, dia: '5', mes: 0 }]));
    component.dia = { day: 5, month: 0, diaName: 'martes', year: 2027 };
    await component.traerData(10, 'Ana', 'Kapping', 5, 2, '', 0, '');
    expect(agendaService.recibirDatos).not.toHaveBeenCalled();
  });

  it('la admin agenda "por confirmar": va a Mis citas con el link listo', async () => {
    const link = { url: 'https://dubenails.com/confirmar/abc' };
    agendaService.agendarPorConfirmar.and.returnValue(of({ id: 'c1', link } as any));
    component.rol = 'admin';
    component.dia = { day: 5, month: 0, diaName: 'martes', year: 2027 };
    component.porConfirmar = true;
    await component.traerData(10, 'Ana', 'Kapping', 5, 2, '', 0, '');
    expect(agendaService.recibirDatos).not.toHaveBeenCalled();
    expect(agendaService.agendarPorConfirmar).toHaveBeenCalledWith(jasmine.objectContaining({ mes: 0, year: 2027 }));
    expect(router.navigate).toHaveBeenCalledWith(['/mis-citas'], { state: { linkNuevo: { citaId: 'c1', link } } });
  });

  describe('buscar clienta al agendar (admin)', () => {
    const escribir = (nombre: string) => {
      component.formGroup.controls['nombre'].setValue(nombre);
      component.find(null, 'nombre');
    };

    beforeEach(() => component.rol = 'admin');

    it('muestra las clientas que coinciden', () => {
      usuariosService.findUsuarioExpress.and.returnValue(of({ usuarios: [{ nombre: 'Luz' }] }));
      escribir('Lu');
      expect(component.listEmail).toEqual([{ nombre: 'Luz' }]);
    });

    it('si no hay coincidencias, la lista se cierra y el nombre escrito se mantiene', () => {
      usuariosService.findUsuarioExpress.and.returnValue(of({ usuarios: [{ nombre: 'Luz' }] }));
      escribir('Lu');
      usuariosService.findUsuarioExpress.and.returnValue(of({ msg: 'No se encontraron usuarios activos' }));
      escribir('Luzmira');
      expect(component.listEmail).toEqual([]);
      expect(component.formGroup.value.nombre).toBe('Luzmira');
    });

    it('si la busqueda falla, la lista se cierra', () => {
      usuariosService.findUsuarioExpress.and.returnValue(of({ usuarios: [{ nombre: 'Luz' }] }));
      escribir('Lu');
      usuariosService.findUsuarioExpress.and.returnValue(throwError(() => 'error'));
      escribir('Luz');
      expect(component.listEmail).toEqual([]);
    });

    it('ignora una respuesta atrasada de lo que ya no esta escrito', () => {
      const lenta = new Subject<any>();
      usuariosService.findUsuarioExpress.and.returnValues(lenta, of({ msg: 'No se encontraron usuarios activos' }));
      escribir('L');
      escribir('Luzmira');
      lenta.next({ usuarios: [{ nombre: 'Leoreanny' }] });
      expect(component.listEmail).toEqual([]);
    });

    it('al salir del campo se cierra la lista', () => {
      component.listEmail = [{ nombre: 'Luz' }];
      component.cerrarSugerencias();
      jasmine.clock().tick(250);
      expect(component.listEmail).toEqual([]);
    });
  });

  describe('horas de la lista al agendar', () => {
    afterEach(() => (contenido.horarioVigente = { dias: [null, ...Array(6).fill({ abre: 9, cierra: 22, almuerzo: [13, 14] })] }));

    it('salen del horario de ese dia (de la apertura a media hora antes del cierre)', () => {
      contenido.horarioVigente = { dias: [null, { abre: 10, cierra: 12, almuerzo: null }, null, null, null, null, null] };
      // 21 de diciembre de 2026 es lunes
      expect(horasDelDia(contenido, { day: 21, month: 11, year: 2026 })).toEqual(['10', '10.5', '11', '11.5']);
    });

    it('dia cerrado o sin fecha: queda la lista de siempre (la admin agenda fuera de horario)', () => {
      expect(horasDelDia(contenido, { day: 20, month: 11, year: 2026 })).toBeNull(); // domingo
      expect(horasDelDia(contenido, undefined)).toBeNull();
    });
  });
});

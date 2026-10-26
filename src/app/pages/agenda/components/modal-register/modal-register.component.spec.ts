import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { ModalRegisterComponent } from './modal-register.component';
import { AgendaService } from 'src/app/services/agenda.service';
import { EventsService } from 'src/app/services/events.service';
import { SharedService } from 'src/app/services/shared.service';
import { PagoService } from 'src/app/services/pago.service';
import { UsuariosService } from 'src/app/services/usuarios.service';
import { ProductosService } from 'src/app/services/productos.service';

describe('ModalRegisterComponent (year al agendar)', () => {
  let component: ModalRegisterComponent;
  let agendaService: jasmine.SpyObj<AgendaService>;

  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2026, 11, 20)); // 20 de diciembre de 2026
    agendaService = jasmine.createSpyObj('AgendaService', ['getDatosDay', 'recibirDatos']);
    agendaService.getDatosDay.and.returnValue(of('No se encontraron registros.'));
    agendaService.recibirDatos.and.returnValue(of('ok'));
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
        { provide: PagoService, useValue: {} },
        { provide: UsuariosService, useValue: {} },
        { provide: ProductosService, useValue: {} },
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
});

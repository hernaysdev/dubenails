import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ContenidoService, HORARIO_POR_DEFECTO } from 'src/app/services/contenido.service';
import { HorarioAtencionComponent, revisarSemana } from './horario-atencion.component';

describe('HorarioAtencionComponent', () => {
  let component: HorarioAtencionComponent;
  let servicio: jasmine.SpyObj<ContenidoService>;

  beforeEach(() => {
    servicio = jasmine.createSpyObj('ContenidoService', ['horario', 'guardarHorario']);
    servicio.horario.and.returnValue(of(HORARIO_POR_DEFECTO));
    servicio.guardarHorario.and.callFake((h) => of(h));
    TestBed.configureTestingModule({
      imports: [HorarioAtencionComponent],
      providers: [{ provide: ContenidoService, useValue: servicio }],
    }).overrideTemplate(HorarioAtencionComponent, '');
    component = TestBed.createComponent(HorarioAtencionComponent).componentInstance;
    component.ngOnInit();
  });

  it('muestra la semana desde el lunes, con el domingo cerrado', () => {
    expect(component.filas.map(f => f.nombre)).toEqual(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']);
    expect(component.filas[0]).toEqual(jasmine.objectContaining({ abierto: true, abre: 9, cierra: 22, conAlmuerzo: true, almuerzo: [13, 14] }));
    expect(component.filas[6].abierto).toBeFalse();
  });

  it('guarda con el indice de la API (0 = domingo) y sin almuerzo si se quita', () => {
    const sabado = component.filas[5];
    component.alternarAlmuerzo(sabado);
    component.elegir(sabado, 'cierra', { target: { value: '15' } } as any);
    component.alternar(component.filas[6]); // abre el domingo
    component.guardar();
    const enviado = servicio.guardarHorario.calls.mostRecent().args[0];
    expect(enviado.dias[6]).toEqual({ abre: 9, cierra: 15, almuerzo: null });
    expect(enviado.dias[0]).toEqual({ abre: 9, cierra: 19, almuerzo: null }); // un dia que estaba cerrado abre sin almuerzo
    expect(component.mensajeOk).toContain('guardado');
  });

  it('copia el lunes a martes-sabado', () => {
    component.elegir(component.filas[0], 'abre', { target: { value: '10' } } as any);
    component.copiarLunes();
    expect(component.filas.slice(1, 6).every(f => f.abre === 10)).toBeTrue();
    expect(component.filas[6].abierto).toBeFalse();
  });

  it('no guarda un horario mal armado y muestra el error de la API', () => {
    component.elegir(component.filas[0], 'cierra', { target: { value: '8' } } as any);
    component.guardar();
    expect(component.mensajeError).toContain('lunes debe cerrar después de abrir');
    expect(servicio.guardarHorario).not.toHaveBeenCalled();
    component.elegir(component.filas[0], 'cierra', { target: { value: '22' } } as any);
    servicio.guardarHorario.and.returnValue(throwError(() => 'No pudimos guardar el horario.'));
    component.guardar();
    expect(component.mensajeError).toBe('No pudimos guardar el horario.');
  });

  it('revisarSemana exige un dia abierto y almuerzo dentro del horario', () => {
    expect(revisarSemana(component.filas.map(f => ({ ...f, abierto: false })))).toContain('al menos un día');
    expect(revisarSemana([{ ...component.filas[0], almuerzo: [8, 9] }])).toContain('almuerzo del lunes');
  });
});

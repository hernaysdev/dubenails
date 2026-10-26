import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { AvisosAdminComponent } from './avisos-admin.component';
import { NotificacionesService } from 'src/app/services/notificaciones.service';

describe('AvisosAdminComponent', () => {
  let fixture: ComponentFixture<AvisosAdminComponent>;
  let servicio: any;

  const crear = (opciones: { soportadas?: boolean; activas?: boolean; endpoint?: string | null; local?: string | null } = {}) => {
    servicio = {
      soportadas: opciones.soportadas ?? true,
      permisoBloqueado: false,
      estado: jasmine.createSpy().and.returnValue(of({ activas: opciones.activas ?? false, endpoint: opciones.endpoint ?? null })),
      endpointLocal: jasmine.createSpy().and.returnValue(Promise.resolve(opciones.local ?? null)),
      activar: jasmine.createSpy().and.returnValue(Promise.resolve()),
      probar: jasmine.createSpy().and.returnValue(of({})),
    };
    TestBed.configureTestingModule({
      declarations: [AvisosAdminComponent],
      providers: [{ provide: NotificacionesService, useValue: servicio }],
    });
    fixture = TestBed.createComponent(AvisosAdminComponent);
  };

  const texto = () => fixture.nativeElement.textContent as string;

  it('sin activar: muestra el boton y al activarlo queda en este dispositivo', fakeAsync(() => {
    crear();
    fixture.detectChanges(); tick(); fixture.detectChanges();
    expect(texto()).toContain('No están activadas');
    fixture.nativeElement.querySelector('button.activar').click();
    tick(); fixture.detectChanges();
    expect(servicio.activar).toHaveBeenCalled();
    expect(texto()).toContain('Activadas en este dispositivo');
    expect(texto()).toContain('notificación de prueba');
  }));

  it('activadas en este dispositivo: ofrece enviar prueba', fakeAsync(() => {
    crear({ activas: true, endpoint: 'https://push/1', local: 'https://push/1' });
    fixture.detectChanges(); tick(); fixture.detectChanges();
    expect(texto()).toContain('Activadas en este dispositivo');
    expect(fixture.nativeElement.querySelector('button.activar')).toBeNull();
  }));

  it('activadas en otro dispositivo: avisa que se moveran', fakeAsync(() => {
    crear({ activas: true, endpoint: 'https://push/otro', local: null });
    fixture.detectChanges(); tick(); fixture.detectChanges();
    expect(texto()).toContain('otro dispositivo');
    expect(fixture.nativeElement.querySelector('button.activar')).not.toBeNull();
  }));

  it('navegador sin soporte: explica como hacerlo en iPhone', () => {
    crear({ soportadas: false });
    fixture.detectChanges();
    expect(texto()).toContain('pantalla de inicio');
    expect(servicio.estado).not.toHaveBeenCalled();
  });
});

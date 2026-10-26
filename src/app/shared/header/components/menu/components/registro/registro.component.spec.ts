import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RegistroComponent } from './registro.component';
import { UsuariosService } from 'src/app/services/usuarios.service';
import { EventsService } from 'src/app/services/events.service';
import { SharedService } from 'src/app/services/shared.service';

describe('RegistroComponent (registro corto)', () => {
  let c: RegistroComponent;
  let usuarios: jasmine.SpyObj<UsuariosService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    usuarios = jasmine.createSpyObj('UsuariosService', ['saveUsuarios', 'autorizacionUser']);
    router = jasmine.createSpyObj('Router', ['navigate']);
    TestBed.configureTestingModule({
      declarations: [RegistroComponent],
      imports: [ReactiveFormsModule],
      providers: [{ provide: UsuariosService, useValue: usuarios }, { provide: Router, useValue: router }, EventsService, SharedService],
    }).overrideTemplate(RegistroComponent, '');
    c = TestBed.createComponent(RegistroComponent).componentInstance;
  });
  afterEach(() => localStorage.removeItem('token'));

  const llenar = () => c.formRegister.setValue({ nombre: ' María José ', correo: ' Maria@Gmail.com ', telefono: '8045550142', password: 'secreta1' });

  it('no pide direccion ni repetir clave, y entra con el correo despues de registrarse', () => {
    usuarios.saveUsuarios.and.returnValue(of({ msg: 'ok', alias: 'maria_jose' }));
    usuarios.autorizacionUser.and.returnValue(of({ token: 'tok', rol: 'user' }));
    llenar();
    c.enviar();
    expect(usuarios.saveUsuarios).toHaveBeenCalledWith({ nombre: 'María José', correo: 'maria@gmail.com', password: 'secreta1', telefono: '8045550142' });
    expect(usuarios.autorizacionUser).toHaveBeenCalledWith({ nombre: 'maria@gmail.com', password: 'secreta1' });
    expect(localStorage.getItem('token')).toBe('tok');
    expect(router.navigate).toHaveBeenCalledWith(['/agenda']);
  });

  it('con destino null (dentro de la reserva) no navega', () => {
    usuarios.saveUsuarios.and.returnValue(of({ msg: 'ok' }));
    usuarios.autorizacionUser.and.returnValue(of({ token: 'tok', rol: 'user' }));
    c.destino = null;
    llenar(); c.enviar();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('formulario invalido: marca los campos y muestra el mensaje, sin llamar a la API', () => {
    c.formRegister.patchValue({ nombre: 'A', correo: 'no-es-correo', telefono: '12', password: '123' });
    c.enviar();
    expect(usuarios.saveUsuarios).not.toHaveBeenCalled();
    expect(c.messageError).toContain('Revisa');
    expect(c.invalido('correo')).toBeTrue();
  });

  it('error de la API (correo repetido) se muestra en el formulario', () => {
    usuarios.saveUsuarios.and.returnValue(throwError(() => 'El correo ya se encuentra registrado'));
    llenar(); c.enviar();
    expect(c.messageError).toBe('El correo ya se encuentra registrado');
    expect(c.enviando).toBeFalse();
  });
});

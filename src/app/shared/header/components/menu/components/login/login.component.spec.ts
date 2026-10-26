import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { LoginComponent } from './login.component';
import { UsuariosService } from 'src/app/services/usuarios.service';
import { EventsService } from 'src/app/services/events.service';
import { SharedService } from 'src/app/services/shared.service';

describe('LoginComponent (Google)', () => {
  let component: LoginComponent;
  let usuarios: jasmine.SpyObj<UsuariosService>;
  let router: jasmine.SpyObj<Router>;
  let shared: SharedService;

  beforeEach(() => {
    usuarios = jasmine.createSpyObj('UsuariosService', ['loginGoogle', 'autorizacionUser']);
    router = jasmine.createSpyObj('Router', ['navigate']);
    TestBed.configureTestingModule({
      declarations: [LoginComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: UsuariosService, useValue: usuarios },
        { provide: Router, useValue: router },
        EventsService,
        SharedService,
      ],
    }).overrideTemplate(LoginComponent, '');
    shared = TestBed.inject(SharedService);
    component = TestBed.createComponent(LoginComponent).componentInstance;
  });

  afterEach(() => localStorage.removeItem('token'));

  it('login con Google exitoso guarda la sesion igual que el login normal', () => {
    usuarios.loginGoogle.and.returnValue(of({ token: 'tok-google', rol: 'user', alias: 'ana' }));
    component.loginGoogle('credencial-de-google');
    expect(usuarios.loginGoogle).toHaveBeenCalledWith('credencial-de-google');
    expect(localStorage.getItem('token')).toBe('tok-google');
    expect(shared.getRolUser().value).toEqual(jasmine.objectContaining({ rol: 'user' }));
    expect(router.navigate).toHaveBeenCalledWith(['/agenda']);
  });

  it('error de la API se muestra y no guarda sesion', () => {
    usuarios.loginGoogle.and.returnValue(throwError(() => ({ msg: 'La cuenta de Google no tiene el correo verificado' })));
    component.loginGoogle('x');
    expect(component.msgError).toContain('correo verificado');
    expect(localStorage.getItem('token')).toBeNull();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});

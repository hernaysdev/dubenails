import { TestBed } from '@angular/core/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { AuthInterceptor } from './auth.interceptor';
import { environment } from 'src/environments/environment';

describe('AuthInterceptor', () => {
  let http: HttpClient;
  let ctrl: HttpTestingController;
  const api = `${environment.urlLocal}api/usuario/123`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }],
    });
    http = TestBed.inject(HttpClient);
    ctrl = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    ctrl.verify();
    localStorage.removeItem('token');
  });

  it('agrega el token a las llamadas a nuestra API', () => {
    localStorage.setItem('token', 'tok-1');
    http.put(api, {}).subscribe();
    expect(ctrl.expectOne(api).request.headers.get('authorization')).toBe('tok-1');
  });

  it('no pisa el header si el servicio ya lo puso', () => {
    localStorage.setItem('token', 'tok-1');
    http.get(api, { headers: { authorization: 'otro' } }).subscribe();
    expect(ctrl.expectOne(api).request.headers.get('authorization')).toBe('otro');
  });

  it('no envia el token a otros dominios', () => {
    localStorage.setItem('token', 'tok-1');
    http.get('https://otro-sitio.example/api/x').subscribe();
    expect(ctrl.expectOne('https://otro-sitio.example/api/x').request.headers.has('authorization')).toBeFalse();
  });

  it('sin sesion no agrega nada', () => {
    http.get(api).subscribe();
    expect(ctrl.expectOne(api).request.headers.has('authorization')).toBeFalse();
  });
});

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

  // token con la forma de un JWT (la firma no se revisa en el front)
  const jwt = (payload: any) => `x.${btoa(JSON.stringify(payload)).replace(/=+$/, '')}.firma`;
  const ahora = Math.floor(Date.now() / 1000);
  const ana1 = jwt({ uid: 'ana', exp: ahora + 3 * 86400 });
  const ana2 = jwt({ uid: 'ana', exp: ahora + 30 * 86400 });
  const respuesta = (nuevo: string) => ({ headers: { 'X-Token-Nuevo': nuevo } });

  it('guarda el token renovado que manda la API (sesion de 30 dias)', () => {
    localStorage.setItem('token', ana1);
    http.get(api).subscribe();
    ctrl.expectOne(api).flush({}, respuesta(ana2));
    expect(localStorage.getItem('token')).toBe(ana2);
  });

  it('tambien cuando el servicio puso el header a mano', () => {
    localStorage.setItem('token', ana1);
    http.get(api, { headers: { authorization: ana1 } }).subscribe();
    ctrl.expectOne(api).flush({}, respuesta(ana2));
    expect(localStorage.getItem('token')).toBe(ana2);
  });

  it('cambia un token antiguo (sin vencimiento) por el nuevo', () => {
    const antiguo = jwt('"ana"');
    localStorage.setItem('token', antiguo);
    http.get(api).subscribe();
    ctrl.expectOne(api).flush({}, respuesta(ana2));
    expect(localStorage.getItem('token')).toBe(ana2);
  });

  it('no revive la sesion si cerro sesion mientras la llamada iba en camino', () => {
    localStorage.setItem('token', ana1);
    http.get(api).subscribe();
    localStorage.removeItem('token');
    ctrl.expectOne(api).flush({}, respuesta(ana2));
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('no pisa la sesion de otra cuenta que entro mientras tanto', () => {
    const bea = jwt({ uid: 'bea', exp: ahora + 30 * 86400 });
    localStorage.setItem('token', ana1);
    http.get(api).subscribe();
    localStorage.setItem('token', bea);
    ctrl.expectOne(api).flush({}, respuesta(ana2));
    expect(localStorage.getItem('token')).toBe(bea);
  });

  it('ignora un token de otra cuenta o mas viejo (respuesta guardada en cache)', () => {
    localStorage.setItem('token', ana2);
    http.get(api).subscribe();
    ctrl.expectOne(api).flush({}, respuesta(ana1));                          // vence antes
    expect(localStorage.getItem('token')).toBe(ana2);
    http.get(api).subscribe();
    ctrl.expectOne(api).flush({}, respuesta(jwt({ uid: 'bea', exp: ahora + 40 * 86400 })));
    expect(localStorage.getItem('token')).toBe(ana2);
  });

  it('sin header nuevo deja el token como estaba', () => {
    localStorage.setItem('token', ana1);
    http.get(api).subscribe();
    ctrl.expectOne(api).flush({});
    expect(localStorage.getItem('token')).toBe(ana1);
  });
});

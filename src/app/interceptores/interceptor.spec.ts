import { TestBed } from '@angular/core/testing';
import { HTTP_INTERCEPTORS, HttpClient, HttpContext } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SIN_SPINNER, SpinnerInterceptor } from './interceptor';
import { SpinnerService } from '../services/interceptor.service';

describe('SpinnerInterceptor', () => {
  let http: HttpClient;
  let ctrl: HttpTestingController;
  let spinner: SpinnerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: HTTP_INTERCEPTORS, useClass: SpinnerInterceptor, multi: true }],
    });
    http = TestBed.inject(HttpClient);
    ctrl = TestBed.inject(HttpTestingController);
    spinner = TestBed.inject(SpinnerService);
  });

  const visible = () => spinner.isLoading$.getValue();

  it('muestra el spinner y lo oculta solo cuando terminan todas las peticiones', () => {
    http.get('/a').subscribe(); http.get('/b').subscribe();
    expect(visible()).toBeTrue();
    ctrl.expectOne('/a').flush({});
    expect(visible()).toBeTrue();              // antes se ocultaba con la primera
    ctrl.expectOne('/b').flush({});
    expect(visible()).toBeFalse();
  });

  it('la autorecarga (SIN_SPINNER) pasa desapercibida', () => {
    http.get('/novedades', { context: new HttpContext().set(SIN_SPINNER, true) }).subscribe();
    expect(visible()).toBeFalse();
    ctrl.expectOne('/novedades').flush({});
  });

  it('mientras esta silenciado (pantallas que se recargan solas) no aparece', () => {
    spinner.silenciar(4000);
    http.get('/mis-citas').subscribe();
    expect(visible()).toBeFalse();
    ctrl.expectOne('/mis-citas').flush({});
  });
});

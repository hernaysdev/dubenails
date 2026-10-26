import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { AgendaService } from './agenda.service';
import { environment } from 'src/environments/environment';

describe('AgendaService (contrato con la API)', () => {
  let service: AgendaService;
  let http: HttpTestingController;
  const base = `${environment.urlLocal}api/agenda`;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(AgendaService);
    http = TestBed.inject(HttpTestingController);
    localStorage.setItem('token', 'token-test');
  });

  afterEach(() => {
    http.verify();
    localStorage.removeItem('token');
  });

  it('usa environment.ts (local) y no la URL de prod en desarrollo', () => {
    expect(service.url).toBe(base);
  });

  it('getDatosDay pide /getday/:dia/:mes/:year con el token', () => {
    service.getDatosDay({ day: 5, month: 0, year: 2027 }).subscribe();
    const req = http.expectOne(`${base}/getday/5/0/2027`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('authorization')).toBe('token-test');
    req.flush({ msg: 'No se encontraron registros.' });
  });

  it('recibirDatos envia el year', () => {
    service.recibirDatos({ nombre: ' Ana ', dia: '5', horaNueva: 10, servicio: 'Kapping', horaServicio: 2, mes: 0, year: 2027 }).subscribe();
    const req = http.expectOne(`${base}/save`);
    expect(req.request.body).toEqual(jasmine.objectContaining({ nombre: 'Ana', mes: 0, year: 2027, hora: 10 }));
    req.flush({ msg: 'ok' });
  });

  it('recibirDatos2 (deshabilitar dia) envia el year', () => {
    service.recibirDatos2({ nombre: 'nombre', dia: '8', horaNueva: 10, mes: 2, year: 2027, diaHabilitado: false }).subscribe();
    const req = http.expectOne(`${base}/save`);
    expect(req.request.body).toEqual(jasmine.objectContaining({ year: 2027, diaHabilitado: false }));
    req.flush({ msg: 'ok' });
  });

  it('habilitarDia envia el year como query', () => {
    service.habilitarDia({ day: '8', month: 2, year: 2027, habilitar: false }).subscribe();
    const req = http.expectOne(`${base}/8/2/false?year=2027`);
    req.flush({ habilitar: 'false' });
  });

  it('getTotalValorMes hace POST /valormes con { mes, year } y suma', (done) => {
    service.getTotalValorMes(11, 2026).subscribe(total => {
      expect(total).toBe(85);
      done();
    });
    const req = http.expectOne(`${base}/valormes`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ mes: 11, year: 2026 });
    req.flush([{ valor: 40 }, { valor: 45 }, { valor: null }]);
  });

  it('getUsersMes hace POST /users/:mes/:year', () => {
    service.getUsersMes(0, 2027).subscribe();
    const req = http.expectOne(`${base}/users/0/2027`);
    expect(req.request.method).toBe('POST');
    req.flush({ agendas: [] });
  });

  it('borrarHora envia el body tal cual (incluye year)', () => {
    const body = { dia: 5, nombre: 'Ana', mes: 0, year: 2027, servicio: 'Kapping', hora: 10 };
    service.borrarHora(body).subscribe();
    const req = http.expectOne(`${base}/borrarHora`);
    expect(req.request.body).toEqual(body);
    req.flush({ msg: 'ok' });
  });
});

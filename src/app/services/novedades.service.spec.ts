import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BehaviorSubject } from 'rxjs';
import { NovedadesService, AvisoNovedad, Cambio } from './novedades.service';
import { SharedService } from './shared.service';

describe('NovedadesService', () => {
  let s: NovedadesService;
  let http: HttpTestingController;
  let cambios: Cambio[];
  let avisos: AvisoNovedad[];

  const responder = (cuerpo: any) => http.expectOne(r => r.url.endsWith('api/novedades')).flush({ ahora: Date.now(), articulos: { nuevos: 0, recientes: [] }, ...cuerpo });

  beforeEach(() => {
    localStorage.setItem('token', 'tok-admin');
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: SharedService, useValue: { getRolUser: () => new BehaviorSubject({ id: 'yo', rol: 'admin' }) } }],
    });
    s = TestBed.inject(NovedadesService);
    http = TestBed.inject(HttpTestingController);
    cambios = []; avisos = [];
    s.cambios$.subscribe(c => cambios.push(c));
    s.aviso$.subscribe(a => avisos.push(a));
  });

  afterEach(() => { http.verify(); localStorage.removeItem('token'); });

  it('la primera respuesta solo guarda la huella; si cambia despues, avisa a la agenda', () => {
    s.consultar(); responder({ citas: { huella: 'h1', nuevas: 2, recientes: [] } });
    expect(cambios).toEqual([]);
    expect(s.citasNuevas$.getValue()).toBe(2);
    s.consultar(); responder({ citas: { huella: 'h1', nuevas: 2, recientes: [] } });
    expect(cambios).toEqual([]);
    s.consultar(); responder({ citas: { huella: 'h2', nuevas: 3, recientes: [{ nombre: 'Ana', dia: 3, mes: 10, hora: 10.5 }] } });
    expect(cambios).toEqual(['agenda']);
    expect(avisos[0]).toEqual({ texto: 'Nueva cita: Ana · 3 nov, 10:30', ruta: '/mis-citas' });
  });

  it('publicaciones nuevas: globo, recarga del Muro y aviso (no por las propias)', () => {
    s.consultar(); responder({ articulos: { nuevos: 2, recientes: [{ nombre: 'Bea', usuario: 'otra' }, { nombre: 'Yo', usuario: 'yo' }] } });
    expect(s.muroNuevos$.getValue()).toBe(2);
    expect(cambios).toEqual(['muro']);
    expect(avisos.map(a => a.texto)).toEqual(['Bea publicó en el Muro']);
    s.marcarMuroVisto();
    expect(s.muroNuevos$.getValue()).toBe(0);
  });

  it('al cambiar de sesion empieza de cero (no confunde la huella de otra cuenta)', () => {
    s.consultar(); responder({ citas: { huella: 'h1', nuevas: 0, recientes: [] } });
    localStorage.setItem('token', 'tok-otra');
    s.consultar(); responder({ citas: { huella: 'h-otra', nuevas: 0, recientes: [] } });
    expect(cambios).toEqual([]);
  });

  it('no superpone consultas mientras espera la respuesta', () => {
    s.consultar(); s.consultar();
    expect(http.match(r => r.url.endsWith('api/novedades')).length).toBe(1);
  });

  it('si abre el Muro mientras la consulta viaja, el globo no vuelve a aparecer', () => {
    localStorage.setItem('muroVisto', String(Date.now() - 60000));
    s.consultar();
    s.marcarMuroVisto();
    responder({ articulos: { nuevos: 3, recientes: [] } });
    expect(s.muroNuevos$.getValue()).toBe(0);
  });
});

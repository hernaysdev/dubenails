import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PostComponent, PostMuro, haceCuanto } from './post.component';
import { ArticulosService } from 'src/app/services/articulos.service';

describe('PostComponent (publicacion del Muro)', () => {
  let c: PostComponent;
  let servicio: jasmine.SpyObj<ArticulosService>;
  let router: jasmine.SpyObj<Router>;
  const base = (): PostMuro => ({
    id: '64b0000000000000000000aa', nombre: 'Builder nude', descripcion: 'x', fecha: 'hoy', imgs: ['a.jpg', 'b.jpg'],
    servicios: [{ id: 'k1', nombre: 'Kapping' }, { id: 'b1', nombre: 'Builder' }], meGustas: 3, meGusta: false, comentarios: 1, usuario: { rol: 'admin' },
  });

  beforeEach(() => {
    servicio = jasmine.createSpyObj('ArticulosService', ['meGusta', 'comentarios', 'comentar', 'borrarComentario']);
    router = jasmine.createSpyObj('Router', ['navigate']);
    TestBed.configureTestingModule({ imports: [PostComponent], providers: [{ provide: ArticulosService, useValue: servicio }, { provide: Router, useValue: router }] });
    const f = TestBed.createComponent(PostComponent);
    c = f.componentInstance;
    c.post = base();
    c.logueado = true;
    f.detectChanges();
  });

  it('la admin aparece como DubeNails; "hace cuanto" legible', () => {
    expect(c.autor.nombre).toBe('DubeNails');
    const ahora = new Date(2026, 9, 26, 12).getTime();
    expect(haceCuanto(new Date(ahora - 5 * 60000), ahora)).toBe('hace 5 min');
    expect(haceCuanto(new Date(ahora - 26 * 3600000), ahora)).toBe('ayer');
    expect(haceCuanto(new Date(2026, 3, 23), ahora)).toBe('23 de abril');
  });

  it('me gusta: se ve al instante y queda con lo que dice la API', () => {
    servicio.meGusta.and.returnValue(of({ meGustas: 4, meGusta: true }));
    c.meGusta();
    expect([c.post.meGusta, c.post.meGustas]).toEqual([true, 4]);
  });

  it('me gusta que falla: vuelve atras y avisa', () => {
    servicio.meGusta.and.returnValue(throwError(() => 'Sin conexión'));
    c.meGusta();
    expect([c.post.meGusta, c.post.meGustas]).toEqual([false, 3]);
    expect(c.aviso).toBe('Sin conexión');
  });

  it('sin sesion pide iniciar sesion', () => {
    c.logueado = false;
    c.meGusta();
    expect(servicio.meGusta).not.toHaveBeenCalled();
    expect(c.aviso).toContain('Inicia sesión');
  });

  it('comentarios: carga, agrega y borra (actualiza el contador)', () => {
    servicio.comentarios.and.returnValue(of([{ id: 'c1', texto: 'Lindas', creado: '', autor: 'Ana', foto: null, esAdmin: false, puedeBorrar: true }]));
    servicio.comentar.and.returnValue(of({ id: 'c2', texto: 'Gracias', creado: '', autor: 'DubeNails', foto: null, esAdmin: true, puedeBorrar: true }));
    servicio.borrarComentario.and.returnValue(of({}));
    c.alternarComentarios();
    expect(c.comentarios.length).toBe(1);
    c.nuevoComentario = ' Gracias ';
    c.comentar();
    expect(servicio.comentar).toHaveBeenCalledWith('64b0000000000000000000aa', 'Gracias');
    expect([c.comentarios.length, c.post.comentarios, c.nuevoComentario]).toEqual([2, 2, '']);
    c.borrarComentario(c.comentarios[0]);
    expect([c.comentarios.length, c.post.comentarios]).toEqual([1, 1]);
  });

  it('"Quiero este diseño" abre la reserva con los servicios marcados', () => {
    c.quieroEsteDiseno();
    expect(router.navigate).toHaveBeenCalledWith(['/reservar'], { queryParams: { marcar: 'k1,b1' } });
  });

  it('compartir: sin la opcion del telefono abre WhatsApp con el link de la publicacion', async () => {
    const nav: any = navigator;
    const share = nav.share;
    nav.share = undefined;
    spyOn(window, 'open');
    await c.compartir();
    expect((window.open as jasmine.Spy).calls.mostRecent().args[0]).toContain('wa.me/?text=');
    expect(decodeURIComponent((window.open as jasmine.Spy).calls.mostRecent().args[0] as string)).toContain('/articulos?p=64b0000000000000000000aa');
    nav.share = share;
  });
});

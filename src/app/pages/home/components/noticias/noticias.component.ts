import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { NovedadesService } from 'src/app/services/novedades.service';
import { ArticulosService } from 'src/app/services/articulos.service';
import { EventsService } from 'src/app/services/events.service';
import { SharedService } from 'src/app/services/shared.service';
import { DisponibilidadService, Servicio } from 'src/app/services/disponibilidad.service';
import { PostMuro } from '../post/post.component';

// Muro: publicaciones (con me gusta, comentarios y "Quiero este diseño"), filtro por servicio,
// "Ver mas" y link compartido (/articulos?p=<id> la muestra destacada arriba).
@Component({
  selector: 'app-noticias',
  templateUrl: './noticias.component.html',
  styleUrls: ['./noticias.component.scss']
})
export class NoticiasComponent implements OnInit, OnDestroy {
  datas: PostMuro[] = [];
  rol = '';
  logueado = false;
  // cuantas publicaciones se piden (la API entrega hasta 50); "Ver mas" suma de a 10
  limite = 10;
  hayMas = false;
  cargando = true;
  cargandoMas = false;
  servicios: Servicio[] = [];
  filtro: { id: string; nombre: string } | null = null;
  destacada: string | null = null;
  mensajeOk = '';
  mensajeError = '';
  private subs: Subscription[] = [];

  constructor(
    private articulosService: ArticulosService,
    private eventsService: EventsService,
    private sharedService: SharedService,
    private route: ActivatedRoute,
    private novedades: NovedadesService,
    private disponibilidad: DisponibilidadService,
  ) { }

  ngOnInit(): void {
    this.subs.push(this.sharedService.getRolUser().subscribe((data) => {
      this.rol = data?.rol || '';
      this.logueado = !!localStorage.getItem('token');
    }));
    this.destacada = this.route.snapshot.queryParamMap.get('p');
    this.disponibilidad.servicios().subscribe({ next: (s) => this.servicios = s, error: () => this.servicios = [] });
    this.cargar();
    // publicacion nueva desde el formulario del menu
    this.subs.push(this.eventsService.cargaArticulos.subscribe((nuevo: any) => {
      this.datas.unshift(this.mapear(nuevo));
    }));
    // abrio el Muro: el globo del menu vuelve a cero; si alguien publica mientras lo mira, se agrega solo
    this.novedades.marcarMuroVisto();
    this.subs.push(this.novedades.cambios$.subscribe(c => {
      if (c !== 'muro') return;
      this.cargar(true);
      this.novedades.marcarMuroVisto();
    }));
  }

  ngOnDestroy(): void { this.subs.forEach(s => s.unsubscribe()); }

  // la API entrega el autor, las fotos (carrusel), los servicios, los me gusta y los comentarios
  private mapear(a: any): PostMuro {
    const fotos: string[] = (a.imgs?.length ? a.imgs : [a.img]).filter(Boolean);
    return {
      id: a._id || a.id, nombre: String(a.nombre || '').trim(), descripcion: a.descripcion, fecha: a.fecha,
      // las fotos se piden en jpg (los HEIC del iPhone no se ven en todos los navegadores)
      imgs: fotos.map(url => url.replace(/\.[a-z0-9]+$/i, '.jpg')),
      servicios: a.servicios || [], meGustas: a.meGustas || 0, meGusta: !!a.meGusta, comentarios: a.comentarios || 0,
      usuario: a.usuario,
    };
  }

  porId(_: number, p: PostMuro) { return p.id; }

  cargar(silencioso = false) {
    if (!silencioso) this.cargando = true;
    this.articulosService.getArticulos(this.limite, this.filtro?.id).subscribe({
      next: (data: any[]) => {
        this.cargando = false; this.cargandoMas = false;
        this.datas = data.map(a => this.mapear(a));
        this.hayMas = data.length >= this.limite && this.limite < 50;
        this.mostrarDestacada();
      },
      error: () => { this.cargando = false; this.cargandoMas = false; this.mensajeError = 'No pudimos cargar el Muro. Intenta de nuevo.'; },
    });
  }

  // link compartido: si la publicacion no esta entre las ultimas, se trae y se pone arriba
  private mostrarDestacada() {
    const id = this.destacada;
    if (!id) return;
    const ir = () => setTimeout(() => document.getElementById('post-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    if (this.datas.some(p => p.id === id)) { ir(); return; }
    this.articulosService.getArticulo(id).subscribe({
      next: (a) => { this.datas.unshift(this.mapear(a)); ir(); },
      error: () => { this.mensajeError = 'Esa publicación ya no está en el Muro.'; this.destacada = null; },
    });
  }

  filtrar(s: { id: string; nombre: string } | null) {
    this.filtro = s && s.id !== this.filtro?.id ? { id: String(s.id), nombre: s.nombre } : null;
    this.limite = 10;
    this.destacada = null;
    this.cargar();
    document.querySelector('.muro')?.scrollIntoView({ behavior: 'smooth' });
  }

  verMas() {
    this.limite = Math.min(this.limite + 10, 50);
    this.cargandoMas = true;
    this.cargar(true);
  }

  borrarArticulo(id: string) {
    this.mensajeOk = ''; this.mensajeError = '';
    this.articulosService.deleteArticulos(id).subscribe({
      next: () => { this.datas = this.datas.filter(e => e.id !== id); this.mensajeOk = 'La publicación se borró del Muro.'; },
      error: () => { this.mensajeError = 'No pudimos borrar la publicación. Intenta de nuevo.'; },
    });
  }
}

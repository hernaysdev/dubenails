import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ArticulosService, ComentarioMuro } from 'src/app/services/articulos.service';

export interface PostMuro {
  id: string; nombre: string; descripcion: string; fecha: string; imgs: string[];
  servicios: { id: string; nombre: string }[]; meGustas: number; meGusta: boolean; comentarios: number; usuario: any;
}

const LOGO = 'https://res.cloudinary.com/mas58/image/upload/v1721692094/usuariosPerfil/tmp-2-1721692094727_cfyyxz.jpg';
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// "hace 5 min", "hace 3 h", "ayer", "hace 4 días" o "23 de abril"
export const haceCuanto = (fecha: Date | null, ahora = Date.now()) => {
  if (!fecha || isNaN(fecha.getTime())) return '';
  const min = Math.floor((ahora - fecha.getTime()) / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const dias = Math.floor(h / 24);
  if (dias === 1) return 'ayer';
  if (dias < 7) return `hace ${dias} días`;
  const mismoAnio = fecha.getFullYear() === new Date(ahora).getFullYear();
  return `${fecha.getDate()} de ${MESES[fecha.getMonth()]}${mismoAnio ? '' : ' de ' + fecha.getFullYear()}`;
};

// la fecha de creacion esta en los primeros 8 caracteres del id de Mongo
export const fechaDeId = (id: string) => /^[0-9a-f]{24}$/.test(String(id)) ? new Date(parseInt(String(id).slice(0, 8), 16) * 1000) : null;

// Una publicacion del Muro: carrusel de fotos, me gusta, comentarios, compartir y "Quiero este diseño".
@Component({
  selector: 'app-post',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.scss']
})
export class PostComponent {
  @Input({ required: true }) post!: PostMuro;
  @Input() rol = '';
  @Input() logueado = false;
  @Input() destacada = false;
  @Output() borrar = new EventEmitter<string>();

  foto = 0;
  menu = false;
  confirmandoBorrar = false;
  aviso = '';
  verComentarios = false;
  comentarios: ComentarioMuro[] = [];
  cargandoComentarios = false;
  nuevoComentario = '';
  enviando = false;
  readonly haceCuanto = haceCuanto;
  readonly fechaDeId = fechaDeId;

  constructor(private articulos: ArticulosService, private router: Router) { }

  // la admin publica como "DubeNails" con el logo; el resto con su nombre y su foto
  get autor() {
    const u = this.post.usuario;
    if (!u || typeof u !== 'object' || u.rol === 'admin') return { nombre: 'DubeNails', foto: LOGO };
    return { nombre: u.nombre || 'Clienta', foto: u.image || LOGO };
  }

  get cuando() { return haceCuanto(fechaDeId(this.post.id)) || this.post.fecha; }

  // indice de la foto visible del carrusel (para los puntos)
  alDeslizar(el: HTMLElement) { this.foto = Math.round(el.scrollLeft / Math.max(el.clientWidth, 1)); }

  irAFoto(el: HTMLElement, i: number) { el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' }); }

  meGusta() {
    if (!this.logueado) { this.aviso = 'Inicia sesión para dar me gusta.'; return; }
    // se ve al instante; si falla se revierte
    const antes = { meGusta: this.post.meGusta, meGustas: this.post.meGustas };
    this.post.meGusta = !antes.meGusta;
    this.post.meGustas = antes.meGustas + (this.post.meGusta ? 1 : -1);
    this.articulos.meGusta(this.post.id).subscribe({
      next: (r) => { this.post.meGusta = r.meGusta; this.post.meGustas = r.meGustas; },
      error: (msg: string) => { Object.assign(this.post, antes); this.aviso = msg; },
    });
  }

  alternarComentarios() {
    this.verComentarios = !this.verComentarios;
    if (!this.verComentarios) return;
    this.cargandoComentarios = true;
    this.articulos.comentarios(this.post.id).subscribe({
      next: (c) => { this.comentarios = c; this.cargandoComentarios = false; },
      error: () => { this.cargandoComentarios = false; this.aviso = 'No pudimos cargar los comentarios.'; },
    });
  }

  comentar() {
    const texto = this.nuevoComentario.trim();
    if (!texto) return;
    this.enviando = true; this.aviso = '';
    this.articulos.comentar(this.post.id, texto).subscribe({
      next: (c) => { this.enviando = false; this.comentarios.push(c); this.post.comentarios++; this.nuevoComentario = ''; },
      error: (msg: string) => { this.enviando = false; this.aviso = msg; },
    });
  }

  borrarComentario(c: ComentarioMuro) {
    this.articulos.borrarComentario(c.id).subscribe({
      next: () => { this.comentarios = this.comentarios.filter(x => x.id !== c.id); this.post.comentarios = Math.max(0, this.post.comentarios - 1); },
      error: (msg: string) => this.aviso = msg,
    });
  }

  // link que abre esta publicacion en el Muro
  get link() { return `${location.origin}/articulos?p=${this.post.id}`; }

  async compartir() {
    const texto = `${this.post.nombre} · DubeNails`;
    const nav: any = navigator;
    if (nav.share) {
      try { await nav.share({ title: texto, text: texto, url: this.link }); return; } catch { return; }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${texto} ${this.link}`)}`, '_blank', 'noopener');
  }

  // abre la reserva con los servicios de esta publicacion ya marcados
  quieroEsteDiseno() {
    this.router.navigate(['/reservar'], { queryParams: { marcar: this.post.servicios.map(s => s.id).join(',') } });
  }
}

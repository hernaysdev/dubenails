import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DisponibilidadService, Servicio, formatoDuracion, partesNombre } from 'src/app/services/disponibilidad.service';

// Portada: invita a reservar. Sin precios (se ven al elegir el servicio en /reservar).
// Cada servicio abre un modal con su descripcion (la escribe la admin en Productos).
@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent implements OnInit {
  servicios: Servicio[] = [];
  abierto: Servicio | null = null;
  readonly duracion = formatoDuracion;
  readonly partes = partesNombre;
  @ViewChild('botonCerrar') botonCerrar?: ElementRef<HTMLButtonElement>;
  private origen: HTMLElement | null = null;

  constructor(private disponibilidad: DisponibilidadService) { }

  ngOnInit(): void {
    // si la API falla, la portada igual muestra el boton para reservar
    this.disponibilidad.servicios().subscribe({ next: (s) => this.servicios = s, error: () => this.servicios = [] });
  }

  abrir(s: Servicio) {
    this.origen = document.activeElement as HTMLElement | null;
    this.abierto = s;
    setTimeout(() => this.botonCerrar?.nativeElement.focus());
  }

  @HostListener('document:keydown.escape')
  cerrar() {
    if (!this.abierto) return;
    this.abierto = null;
    // el foco vuelve a la tarjeta que abrio el modal
    this.origen?.focus();
  }
}

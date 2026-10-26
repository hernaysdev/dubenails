import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DisponibilidadService, Servicio, formatoDuracion } from 'src/app/services/disponibilidad.service';

// Portada: invita a reservar. Sin precios (se ven al elegir el servicio en /reservar).
@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent implements OnInit {
  servicios: Servicio[] = [];
  readonly duracion = formatoDuracion;

  constructor(private disponibilidad: DisponibilidadService) { }

  // "Extensión (Polygel / Builder / Acrilico) corto" -> titulo "Extensión" y detalle "Polygel / Builder / Acrilico · corto"
  partes(nombre: string): { titulo: string; detalle: string } {
    const limpio = nombre.replace(/\s+desde\s*$/i, '').trim();
    const m = limpio.match(/^([^(]+)\(([^)]*)\)\s*(.*)$/);
    if (!m) return { titulo: limpio, detalle: '' };
    return { titulo: m[1].trim(), detalle: [m[2].trim(), m[3].trim()].filter(Boolean).join(' · ') };
  }

  ngOnInit(): void {
    // si la API falla, la portada igual muestra el boton para reservar
    this.disponibilidad.servicios().subscribe({ next: (s) => this.servicios = s, error: () => this.servicios = [] });
  }
}

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

  ngOnInit(): void {
    // si la API falla, la portada igual muestra el boton para reservar
    this.disponibilidad.servicios().subscribe({ next: (s) => this.servicios = s, error: () => this.servicios = [] });
  }
}

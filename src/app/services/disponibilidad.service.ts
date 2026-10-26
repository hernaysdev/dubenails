import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Servicio { id: string; nombre: string; precio: number; duracion: number; descripcion?: string; }
// cerrado: domingo o dia deshabilitado por la admin (un dia lleno o pasado tiene libres 0 pero no es cerrado)
export interface DiaDisponible { dia: number; libres: number; cerrado?: boolean; }

// API publica de disponibilidad (no requiere sesion). mes va de 0 a 11 como en la agenda.
@Injectable({ providedIn: 'root' })
export class DisponibilidadService {
  private url = `${environment.urlLocal}api/disponibilidad`;

  constructor(private http: HttpClient) { }

  servicios(): Observable<Servicio[]> {
    return this.http.get<Servicio[]>(`${this.url}/servicios`);
  }

  dias(servicio: string, mes: number, year: number): Observable<DiaDisponible[]> {
    return this.http.get<{ dias: DiaDisponible[] }>(`${this.url}/dias`, { params: { servicio, mes, year } })
      .pipe(map(r => r.dias));
  }

  horas(servicio: string, dia: number, mes: number, year: number): Observable<number[]> {
    return this.http.get<{ horas: number[] }>(`${this.url}/horas`, { params: { servicio, dia, mes, year } })
      .pipe(map(r => r.horas));
  }
}

// pesos chilenos: 18000 -> "$18.000" (punto de miles, sin decimales)
const formatoCLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' });
export const formatoDinero = (n: number | string | null | undefined) => formatoCLP.format(Number(n) || 0);

// 9.5 -> "09:30"
export const formatoHora = (h: number) => `${String(Math.floor(h)).padStart(2, '0')}:${h % 1 ? '30' : '00'}`;
// 1.5 -> "1 h 30 min"
export const formatoDuracion = (horas: number) => {
  const min = Math.round(horas * 60);
  if (min < 60) return `${min} min`;
  return min % 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min / 60} h`;
};

// "Extensión (Polygel / Builder / Acrilico) corto" -> titulo "Extensión" y detalle "Polygel / Builder / Acrilico · corto"
export const partesNombre = (nombre: string): { titulo: string; detalle: string } => {
  const limpio = String(nombre).replace(/\s+desde\s*$/i, '').trim();
  const m = limpio.match(/^([^(]+)\(([^)]*)\)\s*(.*)$/);
  if (!m) return { titulo: limpio, detalle: '' };
  return { titulo: m[1].trim(), detalle: [m[2].trim(), m[3].trim()].filter(Boolean).join(' · ') };
};

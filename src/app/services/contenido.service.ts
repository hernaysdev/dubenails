import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Contacto {
  indicaciones: string[];
  whatsapp: string;
  instagram: string;
  correo: string;
  direccion: string;
}

// medio de pago que ve la clienta (solo los activos)
export interface MedioPago { id: string; nombre: string; datos: string; }
// como lo edita la admin (un medio nuevo aun no tiene id: lo asigna la API)
export interface MedioPagoAdmin { id?: string; nombre: string; datos: string; activo: boolean; }

// horario de atencion de un dia (horas en decimales: 9.5 = 9:30); null = cerrado
export interface DiaHorario { abre: number; cierra: number; almuerzo: [number, number] | null; }
// indice 0 = domingo (como Date.getDay)
export interface Horario { dias: (DiaHorario | null)[]; }

const DIA_HABIL: DiaHorario = { abre: 9, cierra: 22, almuerzo: [13, 14] };
/** El de siempre (lun-sab 9 a 22, almuerzo 13 a 14, domingo cerrado): rige mientras no llegue el de la API. */
export const HORARIO_POR_DEFECTO: Horario = { dias: [null, DIA_HABIL, DIA_HABIL, DIA_HABIL, DIA_HABIL, DIA_HABIL, DIA_HABIL] };

const NOMBRES_DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const hora = (h: number) => `${Math.floor(h)}:${h % 1 ? '30' : '00'}`;
const mayuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/**
 * Horario en una linea para la portada: junta los dias seguidos con el mismo horario (la semana parte el lunes).
 * El de siempre: "Lunes a sábado · 9:00 a 22:00".
 */
export const resumenHorario = (h: Horario): string => {
  const orden = [1, 2, 3, 4, 5, 6, 0];
  const grupos: { desde: number; hasta: number; abre: number; cierra: number }[] = [];
  for (const i of orden) {
    const d = h.dias[i];
    if (!d) continue;
    const ultimo = grupos.at(-1);
    const seguido = ultimo && orden.indexOf(ultimo.hasta) === orden.indexOf(i) - 1;
    if (ultimo && seguido && ultimo.abre === d.abre && ultimo.cierra === d.cierra) ultimo.hasta = i;
    else grupos.push({ desde: i, hasta: i, abre: d.abre, cierra: d.cierra });
  }
  const textos = grupos.map(g => {
    const dias = g.desde === g.hasta ? mayuscula(NOMBRES_DIAS[g.desde]) : `${mayuscula(NOMBRES_DIAS[g.desde])} a ${NOMBRES_DIAS[g.hasta]}`;
    return `${dias} · ${hora(g.abre)} a ${hora(g.cierra)}`;
  });
  return textos.join(' · ');
};

// contenido editable por la admin (lectura publica; el token lo agrega AuthInterceptor)
@Injectable({ providedIn: 'root' })
export class ContenidoService {
  private url = `${environment.urlLocal}api/contenido`;

  /** ultimo horario conocido (el calendario lo carga al abrir; la lista de horas lo lee de aqui) */
  horarioVigente: Horario = HORARIO_POR_DEFECTO;

  constructor(private http: HttpClient) { }

  horario(): Observable<Horario> {
    return this.http.get<Horario>(`${this.url}/horario`).pipe(
      tap(h => { if (Array.isArray(h?.dias) && h.dias.length === 7) this.horarioVigente = h; }),
      // sin conexion o con una API antigua: el de siempre
      catchError(() => of(this.horarioVigente)),
    );
  }

  guardarHorario(h: Horario): Observable<Horario> {
    return this.http.put<Horario>(`${this.url}/horario`, h).pipe(
      tap(r => { this.horarioVigente = r; }),
      catchError((e: any) => throwError(() => e.error?.msg || 'No pudimos guardar el horario.')),
    );
  }

  /** horario del dia (null = cerrado). fecha con mes 0-11 */
  horarioDelDia(year: number, mes: number, dia: number): DiaHorario | null {
    return this.horarioVigente.dias[new Date(year, mes, dia).getDay()] ?? null;
  }

  contacto(): Observable<Contacto> {
    return this.http.get<Contacto>(`${this.url}/contacto`);
  }

  guardarContacto(datos: Contacto): Observable<Contacto> {
    return this.http.put<Contacto>(`${this.url}/contacto`, datos)
      .pipe(catchError((e: any) => throwError(() => e.error?.msg || 'No pudimos guardar los cambios.')));
  }

  // medios de pago activos y porcentajes que puede elegir la clienta (si no hay medios, no se pide pago)
  pagos(): Observable<{ medios: MedioPago[]; porcentajes: number[] }> {
    return this.http.get<{ medios: MedioPago[]; porcentajes: number[] }>(`${this.url}/pagos`);
  }

  pagosAdmin(): Observable<MedioPagoAdmin[]> {
    return this.http.get<MedioPagoAdmin[]>(`${this.url}/pagos/admin`);
  }

  guardarPagos(medios: MedioPagoAdmin[]): Observable<any> {
    return this.http.put(`${this.url}/pagos`, medios.map(({ id, nombre, activo, datos }) => ({ id, nombre: nombre.trim(), activo, datos: datos.trim() })))
      .pipe(catchError((e: any) => throwError(() => e.error?.msg || 'No pudimos guardar los datos de pago.')));
  }
}

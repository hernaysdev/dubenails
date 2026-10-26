import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PagoElegido, formularioPago } from './agenda.service';
import { MedioPago } from './contenido.service';

export type EstadoReserva = 'pendiente' | 'confirmada' | 'vencida' | 'rechazada' | 'en-revision';

export interface ReservaPorConfirmar {
  estado: EstadoReserva; nombre: string; servicio: string;
  dia: number; mes: number; year: number; hora: number; tramo: number; valor: number | null;
  vence: string; venceTexto: string; pideOtroHorario: boolean; direccion: string; whatsapp: string;
  // la cita no tiene correo: la pagina se lo pide para poder avisarle
  tieneCorreo?: boolean;
  // si la admin configuro medios de pago, la clienta confirma adjuntando la captura
  pago?: { requerido: boolean; estado?: string; motivoRechazo?: string; opciones?: { porcentaje: number; monto: number }[] };
  medios?: MedioPago[];
}

// pagina publica /confirmar/:token: la clienta acepta la hora que le aparto la admin (sin cuenta)
@Injectable({ providedIn: 'root' })
export class ConfirmarService {
  private url = `${environment.urlLocal}api/confirmar`;

  constructor(private http: HttpClient) { }

  ver(token: string): Observable<ReservaPorConfirmar> {
    return this.http.get<ReservaPorConfirmar>(`${this.url}/${encodeURIComponent(token)}`)
      .pipe(catchError(e => throwError(() => ({ status: e.status, msg: e.error?.msg }))));
  }

  // correo: solo si la cita no tenia (la clienta lo deja para recibir los avisos)
  responder(token: string, accion: 'aceptar' | 'rechazar' | 'otro-horario', correo = ''): Observable<{ estado: EstadoReserva; pideOtroHorario?: boolean }> {
    return this.http.post<any>(`${this.url}/${encodeURIComponent(token)}/${accion}`, correo ? { correo } : {})
      .pipe(catchError(e => throwError(() => ({ status: e.status, msg: e.error?.msg }))));
  }

  subirPago(token: string, pago: PagoElegido, correo = ''): Observable<{ estado: EstadoReserva; monto: number }> {
    const fd = formularioPago(pago);
    if (correo) fd.append('correo', correo);
    return this.http.post<any>(`${this.url}/${encodeURIComponent(token)}/pago`, fd)
      .pipe(catchError(e => throwError(() => ({ status: e.status, msg: e.error?.msg }))));
  }
}

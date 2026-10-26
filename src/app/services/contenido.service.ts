import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
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
// como lo edita la admin
export interface MedioPagoAdmin extends MedioPago { activo: boolean; }

// contenido editable por la admin (lectura publica; el token lo agrega AuthInterceptor)
@Injectable({ providedIn: 'root' })
export class ContenidoService {
  private url = `${environment.urlLocal}api/contenido`;

  constructor(private http: HttpClient) { }

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
    return this.http.put(`${this.url}/pagos`, medios.map(({ id, activo, datos }) => ({ id, activo, datos })))
      .pipe(catchError((e: any) => throwError(() => e.error?.msg || 'No pudimos guardar los datos de pago.')));
  }
}

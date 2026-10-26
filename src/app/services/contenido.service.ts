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
}

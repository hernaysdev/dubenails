import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, throwError, timeout } from 'rxjs';
import { ESPERA_SUBIDA_MS } from '../shared/validar-foto';

@Injectable({
  providedIn: 'root'
})
export class ArticulosService {
  public url : any = `${environment.urlLocal}api/articulos`;
  constructor(
    private http : HttpClient
  ) {}


  // servicio: id para filtrar el Muro por servicio
  getArticulos(limit:Number, servicio?: string | null){
    return this.http.get<any>(`${this.url}/${limit}`, servicio ? { params: { servicio } } : {})
    .pipe(map((data) => {
      return data;
  })
  ,catchError((error) => {
    return throwError(() => error)
  }))

}

  

  saveArticulos(formData:any){
    return this.http.post<any>(`${this.url}`, formData)
    .pipe(timeout(ESPERA_SUBIDA_MS), map((data) => {
        return data;
    })
    ,catchError((error) => {
      // sin respuesta a tiempo o error sin mensaje (ej. el proxy cortó): mensaje claro
      if (error?.name === 'TimeoutError') return throwError(() => 'El servidor tardó demasiado. Revisa tu conexión e intenta de nuevo.');
      return throwError(() => error?.error?.msg || '')
    })
    )
  }

  deleteArticulos(id:string){
    return this.http.delete<any>(`${this.url}/${id}`)
    .pipe(map((data) => {
        return data;
    })
    ,catchError((error) => {
      return throwError(() => error.error.msg)
    })
    )
  }


  // ---------- Muro: una publicacion, me gusta y comentarios ----------

  getArticulo(id: string) {
    return this.http.get<any>(`${this.url}/post/${id}`);
  }

  meGusta(id: string) {
    return this.http.post<{ meGustas: number; meGusta: boolean }>(`${this.url}/${id}/like`, {})
      .pipe(catchError((e) => throwError(() => e?.error?.msg || 'No pudimos guardar tu me gusta.')));
  }

  comentarios(id: string) {
    return this.http.get<ComentarioMuro[]>(`${this.url}/${id}/comentarios`);
  }

  comentar(id: string, texto: string) {
    return this.http.post<ComentarioMuro>(`${this.url}/${id}/comentarios`, { texto })
      .pipe(catchError((e) => throwError(() => e?.error?.msg || 'No pudimos guardar el comentario.')));
  }

  borrarComentario(id: string) {
    return this.http.delete<any>(`${this.url}/comentarios/${id}`)
      .pipe(catchError((e) => throwError(() => e?.error?.msg || 'No pudimos borrar el comentario.')));
  }
}

export interface ComentarioMuro { id: string; texto: string; creado: string; autor: string; foto: string | null; esAdmin: boolean; puedeBorrar: boolean; }

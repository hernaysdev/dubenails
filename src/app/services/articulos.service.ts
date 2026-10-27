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


  getArticulos(limit:Number){
    return this.http.get<any>(`${this.url}/${limit}`)
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

}

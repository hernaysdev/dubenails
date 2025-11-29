import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment.prod';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PagoService {
  public url: any = `${environment.urlLocal}api/pagos`;
  constructor(
    private http: HttpClient
  ) { }


  generarPago(correo: string, tokenUsuario: string, mes: string, dia: string, hora: string) {
    const horaformato = hora.replace('.','_');
    return this.http.get<any>(`${this.url}/generar/${correo}/${tokenUsuario}/${mes}/${dia}/${horaformato}`)
      .pipe(map((data) => {
        return data;
      })
        , catchError((error) => {
          return throwError(() => error)
        }))

  }

   verificarPago(token:string, id:string){
  return this.http.post<any>(`${this.url}/confirmar`, {token , id})
  .pipe(map((data) => {
      return data;
  })
  ,catchError((error) => {
    return throwError(() => error.error.msg)
  })
  )
} 


}

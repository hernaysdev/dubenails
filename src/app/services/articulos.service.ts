import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment.prod';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, throwError } from 'rxjs';

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
    .pipe(map((data) => {
        return data;
    })
    ,catchError((error) => {
      return throwError(() => error.error.msg)
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

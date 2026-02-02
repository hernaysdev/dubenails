import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, pipe, throwError } from 'rxjs';
import { environment } from 'src/environments/environment.prod';
import { EventsService } from './events.service';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {
  public productos = {};
  public dataClientes: any[] = [];
  public url: any = `${environment.urlLocal}api/productos`;

  constructor(
    private http: HttpClient,
    public eventsService: EventsService
  ) { }

  getProductos(): any {

    const token = localStorage.getItem('token')

    return this.http.get<any>(`${this.url}/getall`, {
      headers: {
        authorization: token ? token : ''
    }})
      .pipe(
        map((resp) => {
            console.log('entro', resp)
          return resp;
        }),
        catchError((error: any) => {

          return throwError(() => error.error.msg);
        })
      )
  }

   save(body: any): any {
    const token = localStorage.getItem('token')
    return this.http.post<any>(`${this.url}/save`, body, {
      headers: {
        authorization: token ? token : ''
    }})
      .pipe(
        map((resp) => {
          return resp;
        }),
        catchError((error: any) => {
          return throwError(() => error.error.msg);
        })
      )
  }



  delete(id: any):Observable<any> {
    const token = localStorage.getItem('token');

    return this.http.post<any>(`${this.url}/delete`, {_id: id}, {headers:{
      authorization: token ? token : ''
    }})
      .pipe(
        map(resp => {
          return resp;
        }),
        catchError((error: any) => {
          return throwError(() => { return error });
        })
      )
  }


  actualizarEstado(data: any): any {
    const token = localStorage.getItem('token')
    return this.http.post<any>(`${this.url}/estado`, data, {headers:{
      authorization: token ? token : ''
    }})
      .pipe(
        map((data: boolean) => {
          return data;
        }), catchError((error: any) => {
          return throwError(() => error.error.msg);
        })
      )
  }

  buscarAgendaPorUsuario(id: string, mes: string, dia: string, hora: string) {
    const token = localStorage.getItem('token')
    return this.http.get<any>(`${this.url}/${id}/${mes}/${dia}/${hora}`, {headers:{
      authorization: token ? token : ''
    }}).pipe(
      map(data => { 
        return data;
      }),catchError((error:any) => {
        return throwError(() => error.error.msg)
      })
    )

  }



}


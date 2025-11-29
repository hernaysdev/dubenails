import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, pipe, throwError } from 'rxjs';
import { environment } from 'src/environments/environment.prod';
import { EventsService } from './events.service';

@Injectable({
  providedIn: 'root'
})
export class AgendaService {
  public agenda = {};
  public dataClientes: any[] = [];
  public url: any = `${environment.urlLocal}api/agenda`;

  constructor(
    private http: HttpClient,
    public eventsService: EventsService
  ) { }

  recibirDatos(datos: any): any {
    const body = {
      nombre: datos.nombre.trim(),
      dia: datos.dia,
      hora: datos.horaNueva,
      servicio: datos.servicio,
      horaServicio: datos.horaServicio,
      telefono: datos.telefono,
      mes: datos.mes,
      id: datos.id,
      nuevo: datos.nuevo,
      token: datos.token,
      estado: datos.estado,
      correo: datos.correo
    }

    const token = localStorage.getItem('token')



    return this.http.post<any>(`${this.url}/save`, body, {
      headers: {
        authorization: token ? token : ''
    }})
      .pipe(
        map((resp) => {
          return resp.msg;
        }),
        catchError((error: any) => {

          return throwError(() => error.error.msg);
        })
      )
  }

  getDatos(): any {
    const token = localStorage.getItem('token');
    return this.http.get<any>(`${this.url}`, {headers:{
      authorization: token ? token : ''
    }})
      .pipe(
        map((data: any) => {
          let array: any[] = [];
          data.agenda.forEach((element: any) => array.push(element));
          array.sort((a: any, b: any) => a.hora - b.hora)
          return array;
        }), catchError((error: any) => {
          return throwError(() => error.error.msg);
        })
      )
  }

  getDatosDay(dataDay: any): any {
    const token = localStorage.getItem('token')
    return this.http.get<any>(`${this.url}/${dataDay.day}/${dataDay.month}`,{headers:{
      authorization: token ? token : ''
    }})
      .pipe(
        map((data: any) => {
          if (data.data) {
            this.eventsService.diaHabilitado.emit(data.data[0].diaHabilitado)
            let array: any[] = [];
            data.data.forEach((element: any) => array.push(element));
            array.sort((a: any, b: any) => a.hora - b.hora)
            return array;
          }
          return data.msg;
        }), catchError((error: any) => {
          return throwError(() => error.error.msg);
        })
      )
  }

  habilitarDia(dataDay: any): any {
    const token = localStorage.getItem('token')
    return this.http.get<any>(`${this.url}/${dataDay.day}/${dataDay.month}/${dataDay.habilitar}`, {headers:{
      authorization: token ? token : ''
    }})
      .pipe(
        map((data: any) => {
          /*  let array:any[] = [];
           data.agenda.forEach((element:any) =>   array.push(element));
           array.sort((a:any , b:any) => a.hora - b.hora)
           return array; */
          return data.habilitar;
        }), catchError((error: any) => {
          return throwError(() => error.error.msg);
        })
      )
  }

  borrarHora(body: any) {
    const token = localStorage.getItem('token');

    return this.http.post<any>(`${this.url}/borrarHora`, body, {headers:{
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

  getTotalValorMes(mes: number) {
    const token = localStorage.getItem('token')
    return this.http.get<any>(`${this.url}/${mes}`,{headers:{
      authorization: token ? token : ''
    }}).pipe(
      map((data) => {
        let sumaValor = 0;
        data.filter((element: any) => element.valor !== null)
          .map((dataValor: any) => {
            sumaValor = sumaValor + dataValor.valor;
          })
        return sumaValor

      })
      , catchError((error: any) => {
        return throwError(() => { return error; })
      })
    )

  }

  getUsersMes(mes: number) {
    const token = localStorage.getItem('token')
    console.log('urll', `${this.url}/users/${mes}`)
    return this.http.post<any>(`${this.url}/users/${mes}`,{},{headers:{
      authorization: token ? token : ''
    }
  }
).pipe(
      map((data) => {
        return data.agendas

      })
      , catchError((error: any) => {
        return throwError(() => { return error; })
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

  recibirDatos2(datos: any): any {
    const diaHabilitado = datos.diaHabilitado !== undefined ? datos.diaHabilitado : true;
    const body = {
      nombre: datos.nombre.trim(),
      dia: datos.dia,
      hora: datos.horaNueva,
      servicio: datos.servicio,
      horaServicio: datos.horaServicio,
      telefono: datos.telefono,
      mes: datos.mes,
      id: datos.id,
      nuevo: datos.nuevo,
      token: datos.token,
      estado: datos.estado,
      correo: datos.correo,
      diaHabilitado
    }

    const token = localStorage.getItem('token')

    return this.http.post<any>(`${this.url}/save`, body, {
      headers: {
        authorization: token ? token : ''
    }})
      .pipe(
        map((resp) => {
          return resp.msg;
        }),
        catchError((error: any) => {
          return throwError(() => error.error.msg);
        })
      )
  }

   checkAgenda(): any {

    const token = localStorage.getItem('token')

    return this.http.get<any>(`${this.url}/check`)
      .pipe(
        map((resp) => {
          return resp.msg;
        }),
        catchError((error: any) => {
          return throwError(() => error.error.msg);
        })
      )
  }


}


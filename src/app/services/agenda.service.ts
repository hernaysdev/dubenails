import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, pipe, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { EventsService } from './events.service';
import { SharedService } from './shared.service';

// lo que elige la clienta al pagar (componente app-pago)
export interface PagoElegido { porcentaje: number; medio: string; archivo: File; }

export const formularioPago = (pago: PagoElegido) => {
  const fd = new FormData();
  fd.append('porcentaje', String(pago.porcentaje));
  fd.append('medio', pago.medio);
  fd.append('captura', pago.archivo, pago.archivo.name);
  return fd;
};

// estado del pago de una cita (Mis citas)
export interface PagoCita {
  estado: 'esperando-captura' | 'en-revision' | 'aprobado' | 'rechazado';
  porcentaje: number | null; monto: number | null; medio: string | null; motivoRechazo: string; tieneCaptura: boolean;
  // la captura se borra 60 dias despues de la cita
  capturaBorrada?: boolean;
}

export interface LinkConfirmacion {
  url: string; vence: string; venceTexto: string; mensaje: string; whatsapp: string; correoEnviado: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AgendaService {
  public agenda = {};
  public dataClientes: any[] = [];
  public url: any = `${environment.urlLocal}api/agenda`;

  constructor(
    private http: HttpClient,
    public eventsService: EventsService,
    private sharedService: SharedService
  ) { }

  recibirDatos(datos: any): any {
    const body = this.cuerpoReserva(datos);
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

  // la admin aparta la hora "por confirmar": la API devuelve el link para la clienta
  agendarPorConfirmar(datos: any): Observable<{ id: string, link: LinkConfirmacion }> {
    return this.http.post<any>(`${this.url}/save`, { ...this.cuerpoReserva(datos), porConfirmar: true })
      .pipe(catchError((error: any) => throwError(() => error.error?.msg)));
  }

  // la clienta aparta la hora para pagar: devuelve el id de la cita (luego subirPago)
  reservarConPago(datos: any): Observable<{ id: string; pago?: boolean; minutos?: number }> {
    return this.http.post<any>(`${this.url}/save`, { ...this.cuerpoReserva(datos), conPago: true })
      .pipe(catchError((error: any) => throwError(() => error.error?.msg)));
  }

  // multipart: captura, porcentaje, medio
  subirPago(id: string, pago: PagoElegido): Observable<{ estado: string; monto: number }> {
    return this.http.post<any>(`${this.url}/mis-citas/${id}/pago`, formularioPago(pago))
      .pipe(catchError((error: any) => throwError(() => ({ status: error.status, msg: error.error?.msg }))));
  }

  // admin: la captura llega como imagen (la URL de Cloudinary nunca sale de la API)
  verCaptura(id: string): Observable<Blob> {
    return this.http.get(`${this.url}/mis-citas/${id}/captura`, { responseType: 'blob' });
  }

  aprobarPago(id: string): Observable<any> {
    return this.http.post<any>(`${this.url}/mis-citas/${id}/pago/aprobar`, {})
      .pipe(catchError((error: any) => throwError(() => error.error?.msg)));
  }

  rechazarPago(id: string, motivo: string): Observable<{ venceTexto: string; correoEnviado: boolean }> {
    return this.http.post<any>(`${this.url}/mis-citas/${id}/pago/rechazar`, { motivo })
      .pipe(catchError((error: any) => throwError(() => error.error?.msg)));
  }

  // aparta una cita ya agendada (o reenvia el link con un plazo nuevo)
  enviarLink(id: string): Observable<LinkConfirmacion> {
    return this.http.post<LinkConfirmacion>(`${this.url}/mis-citas/${id}/link`, {})
      .pipe(catchError((error: any) => throwError(() => error.error?.msg)));
  }

  private cuerpoReserva(datos: any) {
    return {
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
      precio: datos.precio,
      year: datos.year,
      ...(datos.servicioIds ? { servicioIds: datos.servicioIds } : {})
    }
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
    return this.http.get<any>(`${this.url}/getday/${dataDay.day}/${dataDay.month}/${dataDay.year}`,{headers:{
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
    return this.http.get<any>(`${this.url}/${dataDay.day}/${dataDay.month}/${dataDay.habilitar}?year=${dataDay.year}`, {headers:{
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

  getTotalValorMes(mes: number,year: number) {
    const token = localStorage.getItem('token')
    const body = {
    mes, year
  }
    return this.http.post<any>(`${this.url}/valormes`,body ,{headers:{
      authorization: token ? token : ''
    },}).pipe(
      map((data) => {
        let sumaValor = 0;
        data.filter((element: any) => element.valor !== null)
          .map((dataValor: any) => {
            sumaValor = sumaValor + dataValor.valor;
          })

          console.log('responde')
        return sumaValor

      })
      , catchError((error: any) => {
        return throwError(() => { return error; })
      })
    )

  }

  getUsersMes(mes: number, year: number) {
    this.sharedService.setDataAgenda([]);
    const token = localStorage.getItem('token')
    console.log('urll', `${this.url}/users/${mes}/${year}`)
    return this.http.post<any>(`${this.url}/users/${mes}/${year}`,{},{headers:{
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


  // ---------- Mis citas (el token lo agrega AuthInterceptor) ----------
  // la admin recibe todas las reservas (esAdmin: true) con los datos de cada clienta
  misCitas() {
    return this.http.get<{ citas: any[], esAdmin: boolean }>(`${this.url}/mis-citas`);
  }

  cancelarMiCita(id: string) {
    return this.http.post<any>(`${this.url}/mis-citas/${id}/cancelar`, {})
      .pipe(catchError((error: any) => throwError(() => error.error?.msg)));
  }

  reprogramarMiCita(id: string, cambio: { dia: number, mes: number, year: number, hora: number }) {
    return this.http.post<any>(`${this.url}/mis-citas/${id}/reprogramar`, cambio)
      .pipe(catchError((error: any) => throwError(() => error.error?.msg)));
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
      year: datos.year,
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


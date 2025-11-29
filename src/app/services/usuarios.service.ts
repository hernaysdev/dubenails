import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment.prod';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, throwError } from 'rxjs';
import { SharedService } from './shared.service';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  public url : any = `${environment.urlLocal}api/`;
  constructor(
    private http : HttpClient,
    private sharedService : SharedService
  ) {}


  getUsuarios(){
    return this.http.get<any>(`${this.url}usuarios`);
  }

  autorizacionUser(body:any){
   return  this.http.post(`${this.url}auth/login` , body  , )
    .pipe(
      map((data:any) => {
        return data;
      }),
      catchError((error:any) => {
        return throwError( () => {
          return error.error;
        })
      })
    )
  }

  autorizarToken(token:string){
    return this.http.get(`${this.url}auth/authorization` , {
       headers : {
        authorization : token
       }
      })
      .pipe(
        map((data:any) => {
          return data;
        }),
        catchError( (error:any) => {
          return throwError(() => {
            return error;
          })
        })
      )
  }

  getUsuario(id:string){
    return this.http.get<any>(`${this.url}usuario`,{
      headers:{
        authorization: id}
    })
    .pipe(map((data:any) => {
         return {
          id: data.id,
          nombre : data.nombre,
          rol : data.rol,
          image:data.image,
          direccion : data.direccion,
          telefono : data.telefono,
          correo : data.correo
         }
    })
    ,catchError( (error:any) => {
      return throwError(() =>{ return error} )
    }))
  }


  saveUsuarios(body:any){
    return this.http.post<any>(`${this.url}usuarios`, body)
    .pipe(map((data) => {
        return data;
    })
    ,catchError((error) => {
      return throwError(() => error.error.msg)
    })
    )
  }

  cargaImg(formData:any , id:string){
    return this.http.put<any>(`${this.url}usuarioImg/${id}`, formData);
  }

  actualizarUsuario(body:any , id:string){
    return this.http.put<any>(`${this.url}usuario/${id}`,body)
    .pipe(map((data) => {
        return data;
    })
    ,catchError((error) => {
      return throwError(() => error.error.msg)
    })
    )
  }

  enviarEmail(body:any){
    return this.http.post<any>(`${this.url}/enviarEmail`,body)
    .pipe(map((data) => {
        return data;
    })
    ,catchError((error) => {
      return throwError(() => error.error.msg)
    })
    )
  }

  recuperarClave(body:any){
    return this.http.post<any>(`${this.url}/actualizarClave`,body)
    .pipe(map((data) => {
        return data;
    })
    ,catchError((error) => {
      return throwError(() => error.error.msg)
    })
    )
  }




  addPushSubscriber(sub:any) {
  let id = '';
     this.sharedService.getRolUser().subscribe(data => {
      id = (data.id === null) ? '1' : data.id;
    }) 
    return this.http.post(`${this.url}notificacion/${id}`, sub, {
      headers: {
        'content-type': 'application/json'
      }
    }).pipe(map(data => {})
    ,catchError( (error:any) => {
      return throwError(() =>{ return error} )
    }))
}

send() {
    return this.http.post('/api/newsletter', null);
}

 findUsuarioExpress(letra:any, type:string){
  const body = {
    letra, type
  }
    return this.http.post<any>(`${this.url}usuarios-express`, body)
    .pipe(map((data) => {
        return data;
    })
    ,catchError((error) => {
      return throwError(() => error.error.msg)
    })
    )
  }



}

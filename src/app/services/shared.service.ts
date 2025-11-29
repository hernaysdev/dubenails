import {Injectable} from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedService {

  public dataAgenda$ : BehaviorSubject<any> = new BehaviorSubject(null);
  public rolUser$ : BehaviorSubject<any> = new BehaviorSubject(null);
  public articulos$ : BehaviorSubject<any> = new BehaviorSubject(null);
  public diaHabilitado$ : BehaviorSubject<boolean> = new BehaviorSubject(true); 
  public dataUsuario$: BehaviorSubject<boolean> = new BehaviorSubject(true); 
  public deleteAgenda$: BehaviorSubject<boolean> = new BehaviorSubject(false); 

  constructor( ) { 
 
  }


  setDataAgenda(data:any){
   this.dataAgenda$.next(data);
  }

  getDataAgenda():BehaviorSubject<any>{
      return this.dataAgenda$;
  }

  setRolUser(rol:string){
    this.rolUser$.next(rol);
   }
 
   getRolUser():BehaviorSubject<any>{
       return this.rolUser$;
   }

   setArticulos(data:any){
    this.articulos$.next(data);
   }
 
   getArticulos():BehaviorSubject<any>{
       return this.articulos$;
   }
   
   setDiaHabilitado(data:any){
    this.diaHabilitado$.next(data);
   }
 
   getDiaHabilitado():BehaviorSubject<any>{
       return this.diaHabilitado$;
   }

   setDataUsuario(data:any){
    this.dataUsuario$.next(data);
   }
 
   getDataUsuario():BehaviorSubject<any>{
       return this.dataUsuario$;
   }

   setDeleteAgenda(data:any){
    this.deleteAgenda$.next(data);
   }

   getDeleteAgenda():BehaviorSubject<any>{
    return this.deleteAgenda$;
   }




}

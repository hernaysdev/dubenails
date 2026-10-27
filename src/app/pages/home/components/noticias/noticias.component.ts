import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { NovedadesService } from 'src/app/services/novedades.service';
import { ArticulosService } from 'src/app/services/articulos.service';
import { EventsService } from 'src/app/services/events.service';
import { SharedService } from 'src/app/services/shared.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-noticias',
  templateUrl: './noticias.component.html',
  styleUrls: ['./noticias.component.scss']
})
export class NoticiasComponent implements OnInit, OnDestroy {
   public datas : any[] = [];
   public activeMenu : boolean = false;
   public rol : string = '';
   public idElement : string = '';
  constructor(
    private articulosService : ArticulosService,
    private eventsService : EventsService,
    private sharedService :SharedService,
    private router :Router,
    private novedades: NovedadesService
  ) { }

  private subNovedades?: Subscription;

  ngOnInit(): void {
   this.sharedService.getRolUser().subscribe((data) => {
    this.rol = data?.rol;
   });
    this.traerArticulos();
    this.cargaArticulosAsync();
    // abrio el Muro: el globo del menu vuelve a cero; si alguien publica mientras lo mira, se agrega solo
    this.novedades.marcarMuroVisto();
    this.subNovedades = this.novedades.cambios$.subscribe(c => {
      if (c !== 'muro') return;
      this.recargar();
      this.novedades.marcarMuroVisto();
    });
  }

  ngOnDestroy(): void { this.subNovedades?.unsubscribe(); }

  // trae las ultimas publicaciones de la API (sin la copia guardada)
  recargar() {
    this.articulosService.getArticulos(10).subscribe({ next: (data) => {
      this.datas = data.map((element: any) => {
        const img = element.img.split('.');
        return {
          nombre: element.nombre.trim(), fecha: element.fecha, usuario: element.usuario, descripcion: element.descripcion,
          img: img[0] + '.' + img[1] + '.' + img[2] + '.jpg', id: element._id,
        };
      });
      this.sharedService.setArticulos(this.datas);
    }, error: () => {} });
  }





  traerArticulos(){
    const limit = 10;

     this.sharedService.getArticulos().subscribe(data => {
      if(data === null){
        this.articulosService.getArticulos(limit).subscribe({next:(data) =>{
          this.datas = data.map((element :any) => {
            const img = element.img.split('.');
            const data = {
               nombre : element.nombre.trim(),
               fecha : element.fecha,
               usuario : element.usuario,
               descripcion : element.descripcion,
               img : img[0] +'.'+ img[1]+'.'+ img[2]+'.jpg',
               id:element._id
            }
            return data;
          })
          this.sharedService.setArticulos(this.datas);
        },error: (error)=>{
        console.log(error)
        }})
      }else{
       this.sharedService.getArticulos().subscribe(data => {
        this.datas = data;
        })
      }
     })
  }

  cargaArticulosAsync(){
   this.eventsService.cargaArticulos.subscribe(data => {
    data.id = data._id;
    this.datas.unshift(data);
    this.sharedService.setArticulos(this.datas);
   })
  }

  activarMenu(id:string){
    this.idElement = id;
    this.activeMenu = !this.activeMenu;
  }

  mensajeOk = '';
  mensajeError = '';

  borrarArticulo(id:string){
    this.mensajeOk = ''; this.mensajeError = '';
    this.articulosService.deleteArticulos(id).subscribe({next:() => {
        this.datas = this.datas.filter(e => e.id !== id);
        this.activeMenu = false;
        this.mensajeOk = 'La publicación se borró del Muro.';
    },error:()=> {
       this.activeMenu = false;
       this.mensajeError = 'No pudimos borrar la publicación. Intenta de nuevo.';
    }})
  }

}

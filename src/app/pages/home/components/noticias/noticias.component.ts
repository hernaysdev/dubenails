import { Component, OnInit } from '@angular/core';
import { ArticulosService } from 'src/app/services/articulos.service';
import { EventsService } from 'src/app/services/events.service';
import { SharedService } from 'src/app/services/shared.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-noticias',
  templateUrl: './noticias.component.html',
  styleUrls: ['./noticias.component.scss']
})
export class NoticiasComponent implements OnInit {
   public datas : any[] = [];
   public activeMenu : boolean = false;
   public rol : string = '';
   public idElement : string = '';
  constructor(
    private articulosService : ArticulosService,
    private eventsService : EventsService,
    private sharedService :SharedService,
    private router :Router
  ) { }

  ngOnInit(): void {
   this.sharedService.getRolUser().subscribe((data) => {
    this.rol = data?.rol;
   });
    this.traerArticulos();
    this.cargaArticulosAsync();
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

  borrarArticulo(id:string){
    this.articulosService.deleteArticulos(id).subscribe({next:(data) => {
        this.datas = this.datas.filter((element:any) => element.id !== data._id)
        this.eventsService.alertMessage('success','Articulo borrado');
        this.datas = this.datas.filter(e => e.id !== id);
    },error:(error)=> {
       console.log(error)
       this.eventsService.alertMessage('error','No se pudo Borrar el Articulo')
    }})
  }

}

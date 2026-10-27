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
   // cuantas publicaciones se piden (la API entrega hasta 50); "Ver mas" suma de a 10
   public limite = 10;
   public hayMas = false;
   public cargandoMas = false;
   public confirmandoBorrar: string | null = null;
   private readonly LOGO = 'https://res.cloudinary.com/mas58/image/upload/v1721692094/usuariosPerfil/tmp-2-1721692094727_cfyyxz.jpg';
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
    this.articulosService.getArticulos(this.limite).subscribe({ next: (data) => {
      this.cargandoMas = false;
      this.datas = data.map((element: any) => this.mapear(element));
      this.hayMas = data.length >= this.limite && this.limite < 50;
      this.sharedService.setArticulos(this.datas);
    }, error: () => { this.cargandoMas = false; } });
  }





  // la API trae el autor (nombre, foto, rol); la foto se pide en jpg
  private mapear(element: any) {
    const img = element.img.split('.');
    return {
      nombre: element.nombre.trim(), fecha: element.fecha, usuario: element.usuario, descripcion: element.descripcion,
      img: img[0] + '.' + img[1] + '.' + img[2] + '.jpg', id: element._id,
    };
  }

  // la admin publica como "DubeNails" con el logo; el resto con su nombre y su foto
  autor(data: any) {
    const u = data.usuario;
    if (!u || typeof u !== 'object' || u.rol === 'admin') return { nombre: 'DubeNails', foto: this.LOGO };
    return { nombre: u.nombre || 'Clienta', foto: u.image || this.LOGO };
  }

  // "hace 5 min", "hace 3 h", "ayer", "hace 4 días" o "23 de abril" (por la fecha de creacion del id)
  haceCuanto(data: any) {
    const id = String(data.id || '');
    const creado = /^[0-9a-f]{24}$/.test(id) ? new Date(parseInt(id.slice(0, 8), 16) * 1000) : null;
    if (!creado) return data.fecha || '';
    const min = Math.floor((Date.now() - creado.getTime()) / 60000);
    if (min < 1) return 'ahora';
    if (min < 60) return `hace ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `hace ${h} h`;
    const dias = Math.floor(h / 24);
    if (dias === 1) return 'ayer';
    if (dias < 7) return `hace ${dias} días`;
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const mismoAnio = creado.getFullYear() === new Date().getFullYear();
    return `${creado.getDate()} de ${meses[creado.getMonth()]}${mismoAnio ? '' : ' de ' + creado.getFullYear()}`;
  }

  verMas() {
    this.limite = Math.min(this.limite + 10, 50);
    this.cargandoMas = true;
    this.recargar();
  }

  traerArticulos(){
    const limit = this.limite;

     this.sharedService.getArticulos().subscribe(data => {
      if(data === null){
        this.articulosService.getArticulos(limit).subscribe({next:(data) =>{
          this.datas = data.map((element: any) => this.mapear(element));
          this.hayMas = data.length >= this.limite && this.limite < 50;
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
        this.confirmandoBorrar = null;
        this.mensajeOk = 'La publicación se borró del Muro.';
    },error:()=> {
       this.activeMenu = false;
       this.mensajeError = 'No pudimos borrar la publicación. Intenta de nuevo.';
    }})
  }

}

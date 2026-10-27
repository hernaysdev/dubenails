import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { EventsService } from 'src/app/services/events.service';
import { UsuariosService } from 'src/app/services/usuarios.service';
import { Router } from '@angular/router';
import { SharedService } from 'src/app/services/shared.service';
import { UsuarioData } from 'src/app/interface/usuarioData.interface';
import { despuesDeComprimir, problemaFoto } from 'src/app/shared/validar-foto';
import { comprimirImagen, PARA_PERFIL } from 'src/app/shared/comprimir-imagen';

export const IMG_DEFAULT = '/assets/img/userIcon.jpg';

// foto de perfil nitida: la de Google se pide en 400px (venia en 96px y se veia pixelada) y la de
// Cloudinary se normaliza a .jpg. Otras se usan tal cual.
export const normalizarImagen = (url: string | null | undefined): string => {
  if (!url) return IMG_DEFAULT;
  if (url.includes('googleusercontent.com')) return url.replace(/=s\d+(-c)?$/, '=s400-c');
  if (!url.includes('res.cloudinary.com')) return url;
  return url.replace(/\.[a-z0-9]+$/i, '.jpg');
}

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
  public tituloMenu: string = 'Menu';
  public menu: boolean = false;
  public showRegistro: boolean = false;
  public showRecuperarClave: boolean = false;
  public lista: boolean = false;
  public showlogin: boolean = false;
  public showRegistroArticulos: boolean = false;
  public usuarioActivo: boolean = false;
  public usuarioData !: UsuarioData;
  public test: any = false;
  public showActualizarUser: boolean = false;
  public showActualizarFoto: boolean = false;
  public showGift: boolean = false;
  showProductos: boolean = false;
  public rolUser: string = '';
  public perfil: boolean = false;
  @Output('id') id: any;

  constructor(
    private eventsService: EventsService,
    private usuariosService: UsuariosService,
    private router: Router,
    private sharedService: SharedService
  ) { }

  ngOnInit() {
    this.eventsService.offMenu.subscribe(valor => {
      this.cerrarTodoMenu(valor)
    })
    this.eventsService.cerrarModalLogin.subscribe((valor: any) => {
      this.menu = valor;
      this.showlogin = valor;
    })
    this.eventsService.showRegistro.subscribe(data => {
      this.loginUser(data)
    })
    this.getusuario();
    this.ocultarMenu();
    this.validarRol();
  }

  validarRol() {
    this.sharedService.getRolUser().subscribe((data: any) => {
      this.rolUser = data?.rol;
      if (data === null) {
        const token = localStorage.getItem('token') as string;
        this.usuariosService.autorizarToken(token).subscribe({
          next: (data: any) => {
            this.rolUser = data.rol;
            this.sharedService.setRolUser(data);
          },
          error: (error) => {
            // token invalido o vencido (la API responde 400): se cierra la sesion local para volver a iniciar.
            // Errores de red (status 0, sin conexion) no cierran la sesion.
            if (error?.status === 400) {
              localStorage.removeItem('token');
              this.sharedService.setRolUser('');
              this.usuarioActivo = false;
            }
          }
        })
      }
    })
  }

  salir() {
    this.sharedService.setRolUser('');
    localStorage.removeItem('token');
    this.menu = false;
    this.showRegistro = false;
    this.lista = false;
    this.showlogin = false;
    this.usuarioActivo = false;
  }

  showMenu() {
    this.menu = true;
    this.lista = true;
    this.perfil = true;
  }

  hideMenu() {
    this.menu = false;
  }


  login() {
    this.showlogin = true;
    this.lista = false;
    this.tituloMenu = 'Inicia Sesión';
  }

  cerrarModal() {
    switch (this.tituloMenu) {
      case 'Menu':
        this.menu = false; break;
      case 'Registrate':
        this.showRegistro = false;
        this.tituloMenu = 'Menu';
        this.lista = false;
        this.menu = false;
        break;
      case 'Inicia Sesión':
        this.showlogin = false;
        this.tituloMenu = 'Menu';
        this.lista = false;
        this.menu = false;
        this.perfil = false;
        break;
      case 'Subir Foto':
        this.perfil = true;
        this.showActualizarFoto = false;
        this.tituloMenu = 'Menu';
        this.lista = false;
        this.menu = false;
        break;
      case 'Nueva publicación':
        this.showRegistroArticulos = false;
        this.tituloMenu = 'Menu';
        this.lista = false;
        this.menu = false;
        break;
      case 'Actualizar perfil':
        this.perfil = true;
        this.showActualizarUser = false;
        this.tituloMenu = 'Menu';
        this.lista = false;
        this.menu = false;
        break;
      case 'Crear GiftCard':
        this.showGift = false;
        this.tituloMenu = 'Menu';
        this.lista = false;
        this.menu = false;
        break;
      case 'Productos':
        this.showProductos = false;
        this.tituloMenu = 'Menu';
        this.lista = false;
        this.menu = false;
        break;
      case 'Recuperar Contraseña':
        this.showRecuperarClave = false;
        this.tituloMenu = 'Menu';
        this.lista = false;
        this.menu = false;
        break;
      // cualquier otro titulo (ej. si se renombra uno): la X igual cierra todo
      default:
        this.showRegistro = this.showlogin = this.showActualizarFoto = this.showRegistroArticulos = false;
        this.showActualizarUser = this.showGift = this.showProductos = this.showRecuperarClave = false;
        this.tituloMenu = 'Menu';
        this.lista = false;
        this.menu = false;
    }
  }

  getusuario() {
    this.router
    const id = localStorage.getItem('token') as string;

    this.usuariosService.getUsuario(id).subscribe({
      next: (data: UsuarioData) => {
        this.sharedService.setDataUsuario(data)
        this.usuarioData = data;
        this.usuarioActivo = true;
        this.perfil = true;
        this.id = data.id;
        this.usuarioData.image = normalizarImagen(data.image);


      },
      error: (error) => {
        this.usuarioActivo = false;
      }
    })
  }


  loginUser(event: any) {
    console.log('esto emite:', event)
    this.getusuario();
    setTimeout(() => {
      this.usuarioActivo = event;
    }, 400)
  }

  showRegister() {
    this.showRegistro = true;
    this.lista = false;
    this.tituloMenu = 'Registrate';
  }
  actualizarUser() {
    this.lista = false;
    this.tituloMenu = 'Actualizar perfil';
    this.showActualizarUser = true;
  }
  // "Subir Foto de Perfil" abre directo la galeria (ya no hay otra pantalla)
  actualizarFoto() { this.elegirFoto(); }

  // ---------- foto de perfil: se elige, se comprime y se sube enseguida ----------
  @ViewChild('inputFoto') inputFoto?: ElementRef<HTMLInputElement>;
  subiendoFoto = false;
  mensajeFoto = '';
  errorFoto = '';

  elegirFoto() { this.inputFoto?.nativeElement.click(); }

  async cambiarFoto(event: any) {
    const original: File | undefined = event.target.files?.[0];
    event.target.value = '';
    this.mensajeFoto = ''; this.errorFoto = problemaFoto(original);
    if (this.errorFoto || !original) return;
    this.subiendoFoto = true;
    const foto = await comprimirImagen(original, PARA_PERFIL);
    this.errorFoto = despuesDeComprimir(foto);
    if (this.errorFoto) { this.subiendoFoto = false; return; }
    const formData = new FormData();
    formData.append('archivo', foto, foto.name);
    this.usuariosService.cargaImg(formData, this.id).subscribe({
      next: (url: string) => {
        this.subiendoFoto = false;
        this.usuarioData.image = normalizarImagen(url);
        this.mensajeFoto = 'Tu foto se actualizó.';
      },
      error: (err: any) => {
        this.subiendoFoto = false;
        this.errorFoto = err?.error?.msg || (typeof err === 'string' ? err : '') || 'No pudimos subir la foto. Intenta de nuevo.';
      },
    });
  }

  RegistrarArticulos() {
    this.perfil = false;
    this.lista = false;
    this.tituloMenu = 'Nueva publicación';
    this.showRegistroArticulos = true;
  }

  ocultarMenu() {
    this.eventsService.ocultarMenu.subscribe(valor => {
      this.menu = valor;
    })
  }

  // si la foto no carga (link vencido, bloqueada), se muestra el icono por defecto
  imagenFallida() {
    if (this.usuarioData.image !== IMG_DEFAULT) this.usuarioData.image = IMG_DEFAULT;
  }

  imgUserCargada(event: string) {
    this.usuarioData.image = event;
    this.cerrarModal();
  }

  cargaArticulo(event: any) {
    this.cerrarModal();
  }

  crearGiftCard() {
    this.lista = false;
    this.tituloMenu = 'Crear GiftCard';
    this.showGift = true;
  }

  misCitas() {
    this.cerrarModal();
    this.router.navigate(['/mis-citas'])
  }

  productos() {
    this.cerrarModal();
    this.router.navigate(['/productos'])
  }

  RecuperarClave() {
    this.showRecuperarClave = true;
    this.lista = false;
    this.tituloMenu = 'Recuperar Contraseña';
  }

  cerrarTodoMenu(valor:boolean){

    if(!valor){
          this.tituloMenu = 'Menu';
          this.showRegistro = false;
          this.lista = false;
          this.menu = false;
          this.showlogin = false;
          this.showActualizarFoto = false;
          this.showRegistroArticulos = false;
          this.showActualizarUser = false;
          this.showGift = false;
          this.showProductos = false;
          this.showRecuperarClave = false;
    }

  }


}

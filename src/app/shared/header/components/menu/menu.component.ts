import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, ViewChild } from '@angular/core';
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
      if (!valor) this.cerrarTodo();
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
    this.cerrarModal();
    this.usuarioActivo = false;
  }

  // ---------- navegacion del menu ----------
  // Abrir el menu y cada seccion agrega una entrada al historial: el boton atras del celular
  // vuelve a la lista o cierra el menu en vez de salir de la pagina.
  showMenu() {
    this.mostrarLista();
    this.menu = true;
    this.enHistorial('menu');
  }

  hideMenu() {
    this.cerrarModal();
  }

  private abrirSeccion(titulo: string) {
    this.lista = false;
    this.perfil = false;
    this.tituloMenu = titulo;
    this.enHistorial('seccion');
  }

  // vuelve de una seccion a la lista del menu
  volver() {
    if (this.nivelHistorial() === 2) history.back();
    else this.mostrarLista();
  }

  // la X: cierra todo y saca del historial las entradas del menu
  cerrarModal() {
    const n = this.nivelHistorial();
    this.cerrarTodo();
    if (n) history.go(-n);
  }

  @HostListener('window:popstate')
  alIrAtras() {
    const nivel = this.nivelHistorial();
    // entradas que quedaron de un menu cerrado desde afuera (ej. al iniciar sesion): se saltan
    if (!this.menu) { if (nivel) history.back(); return; }
    if (nivel === 1) this.mostrarLista();
    else if (nivel === 0) this.cerrarTodo();
  }

  private mostrarLista() {
    this.ocultarSecciones();
    this.tituloMenu = 'Menu';
    this.lista = true;
    this.perfil = true;
  }

  private cerrarTodo() {
    this.ocultarSecciones();
    this.tituloMenu = 'Menu';
    this.lista = false;
    this.menu = false;
  }

  private ocultarSecciones() {
    this.showRegistro = this.showlogin = this.showActualizarFoto = this.showRegistroArticulos = false;
    this.showActualizarUser = this.showGift = this.showProductos = this.showRecuperarClave = false;
  }

  private enHistorial(nivel: 'menu' | 'seccion') {
    try { history.pushState({ ...(history.state || {}), dubeMenu: nivel }, ''); } catch { }
  }

  // 0: sin menu en el historial, 1: menu abierto, 2: dentro de una seccion
  private nivelHistorial(): number {
    const nivel = history.state?.dubeMenu;
    return nivel === 'seccion' ? 2 : nivel === 'menu' ? 1 : 0;
  }

  login() {
    this.abrirSeccion('Iniciar sesión');
    this.showlogin = true;
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
    this.abrirSeccion('Crear cuenta');
    this.showRegistro = true;
  }
  actualizarUser() {
    this.abrirSeccion('Editar mis datos');
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
    this.abrirSeccion('Nueva publicación');
    this.showRegistroArticulos = true;
  }

  ocultarMenu() {
    this.eventsService.ocultarMenu.subscribe(valor => {
      if (!valor) this.cerrarTodo();
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
    this.abrirSeccion('Crear GiftCard');
    this.showGift = true;
  }

  misCitas() { this.irA('/mis-citas'); }

  productos() { this.irA('/productos'); }

  // ir a otra pagina desde la lista: la entrada del menu se reemplaza (atras vuelve a la pagina anterior)
  private irA(ruta: string) {
    const enMenu = this.nivelHistorial() > 0;
    this.cerrarTodo();
    this.router.navigate([ruta], { replaceUrl: enMenu });
  }

  RecuperarClave() {
    this.abrirSeccion('Recuperar contraseña');
    this.showRecuperarClave = true;
  }

  cerrarTodoMenu(valor: boolean) {
    if (!valor) this.cerrarTodo();
  }

}

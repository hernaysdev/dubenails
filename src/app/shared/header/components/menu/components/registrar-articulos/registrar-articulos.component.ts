import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormGroup , FormBuilder } from '@angular/forms';
import * as moment from 'moment';
import { ArticulosService } from 'src/app/services/articulos.service';
import { EventsService } from 'src/app/services/events.service';
import { DisponibilidadService, Servicio } from 'src/app/services/disponibilidad.service';
import { despuesDeComprimir, problemaFoto } from 'src/app/shared/validar-foto';
import { comprimirImagen, PARA_MURO } from 'src/app/shared/comprimir-imagen';

export const MAX_FOTOS = 5;
export const MAX_SERVICIOS_POST = 3;

interface FotoElegida { archivo: File; vista: string | null; }

// Nueva publicacion del Muro: hasta 5 fotos (carrusel), titulo, descripcion y los servicios del trabajo
// (para "Quiero este diseño" y el filtro del Muro).
@Component({
  selector: 'app-registrar-articulos',
  templateUrl: './registrar-articulos.component.html',
  styleUrls: ['./registrar-articulos.component.scss']
})
export class RegistrarArticulosComponent implements OnInit, OnDestroy {
  public formArticulos : FormGroup;
  fotos: FotoElegida[] = [];
  servicios: Servicio[] = [];
  elegidos: string[] = [];
  readonly maxFotos = MAX_FOTOS;
  readonly maxServicios = MAX_SERVICIOS_POST;
  @Input('idUser') idUser :any;
  @Output('success') success : EventEmitter<any> = new EventEmitter();

  mensajeError = '';
  enviando = false;

  constructor(
    private formBuilder : FormBuilder,
    private articulosService :ArticulosService,
    private eventsService : EventsService,
    private disponibilidad: DisponibilidadService,
  ) {
    this.formArticulos = this.formBuilder.group({
      nombre:[''],
      descripcion:['']
    })
   }

  ngOnInit(): void {
    this.disponibilidad.servicios().subscribe({ next: (s) => this.servicios = s, error: () => this.servicios = [] });
  }

  ngOnDestroy(): void { this.fotos.forEach(f => f.vista && URL.revokeObjectURL(f.vista)); }

  // agrega las fotos elegidas (varias a la vez o de a una). Se comprimen en el navegador: cualquier foto sirve
  // (HEIC del iPhone, fotos de 10 MB) y al servidor llega un JPG liviano.
  preparando = false;
  async cargarImg(event:any){
    const nuevos: File[] = Array.from(event.target.files || []);
    event.target.value = '';
    this.mensajeError = '';
    this.preparando = true;
    for (const original of nuevos) {
      if (this.fotos.length >= MAX_FOTOS) { this.mensajeError = `Puedes subir hasta ${MAX_FOTOS} fotos por publicación.`; break; }
      const problema = problemaFoto(original);
      if (problema) { this.mensajeError = problema; continue; }
      const archivo = await comprimirImagen(original, PARA_MURO);
      const pesada = despuesDeComprimir(archivo);
      if (pesada) { this.mensajeError = pesada; continue; }
      // ya comprimida es JPG: la vista previa funciona tambien con fotos HEIC
      const vista = archivo.type === 'image/jpeg' || (archivo.type.startsWith('image/') && !/heic|heif/i.test(archivo.type)) ? URL.createObjectURL(archivo) : null;
      this.fotos.push({ archivo, vista });
    }
    this.preparando = false;
  }

  quitarFoto(i: number) {
    const [f] = this.fotos.splice(i, 1);
    if (f?.vista) URL.revokeObjectURL(f.vista);
  }

  alternarServicio(id: string) {
    if (this.elegidos.includes(id)) { this.elegidos = this.elegidos.filter(e => e !== id); return; }
    if (this.elegidos.length >= MAX_SERVICIOS_POST) { this.mensajeError = `Elige hasta ${MAX_SERVICIOS_POST} servicios.`; return; }
    this.elegidos = [...this.elegidos, id];
  }

  enviar(){
    this.mensajeError = '';
    const valores = this.formArticulos.value;
    if (this.preparando) { this.mensajeError = 'Espera a que terminen de prepararse las fotos.'; return; }
    if (!this.fotos.length) { this.mensajeError = 'Elige al menos una foto para la publicación.'; return; }
    if (!valores.nombre?.trim() || !valores.descripcion?.trim()) { this.mensajeError = 'Escribe un título y una descripción.'; return; }
    this.enviando = true;
    moment.locale('es');
    const fecha = moment().format('MMMM Do YYYY, h:mm:ss a');
    const { nombre , descripcion } = this.formArticulos.value;
    const formData = new FormData();
    this.fotos.forEach(f => formData.append('archivo', f.archivo, f.archivo.name));
    formData.append('nombre', nombre.trim());
    formData.append('fecha', fecha);
    formData.append('descripcion', descripcion.trim());
    formData.append('servicios', this.elegidos.join(','));
    formData.append('id', this.idUser);
    this.articulosService.saveArticulos(formData).subscribe({next: (data) => {
      this.enviando = false;
      this.success.emit(true);
      this.eventsService.cargaArticulos.emit(data);
      this.eventsService.alertMessage('success','Publicado en el Muro');
    }, error: (err: any) => {
      this.enviando = false;
      this.mensajeError = err?.error?.msg || (typeof err === 'string' ? err : '') || 'No pudimos publicar. Revisa las fotos e intenta de nuevo.';
    }})
  }
}

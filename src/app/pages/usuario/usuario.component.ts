import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Contacto, ContenidoService } from 'src/app/services/contenido.service';
import { SharedService } from 'src/app/services/shared.service';

// Contacto: contenido desde la API; la admin lo edita en la misma pagina
@Component({
  selector: 'app-usuario',
  templateUrl: './usuario.component.html',
  styleUrls: ['./usuario.component.scss']
})
export class UsuarioComponent implements OnInit {
  contacto: Contacto | null = null;
  mapa: SafeResourceUrl | null = null;
  esAdmin = false;
  editando = false;
  guardando = false;
  mensajeOk = '';
  mensajeError = '';
  form: FormGroup;

  constructor(
    private contenidoService: ContenidoService,
    private sharedService: SharedService,
    private sanitizer: DomSanitizer,
    fb: FormBuilder,
  ) {
    this.form = fb.group({
      indicaciones: ['', [Validators.required]],
      whatsapp: [''],
      instagram: [''],
      correo: [''],
      direccion: ['', [Validators.required]],
    });
  }

  ngOnInit() {
    this.sharedService.getRolUser().subscribe((rol: any) => this.esAdmin = rol?.rol === 'admin');
    this.contenidoService.contacto().subscribe({
      next: (c) => this.mostrar(c),
      error: () => this.mensajeError = 'No pudimos cargar la información de contacto.'
    });
  }

  private mostrar(c: Contacto) {
    this.contacto = c;
    // el mapa se arma solo con la direccion (texto codificado) sobre una URL fija de Google Maps
    this.mapa = c.direccion
      ? this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.google.com/maps?q=${encodeURIComponent(c.direccion)}&output=embed`)
      : null;
  }

  get linkWhatsapp() {
    const numero = (this.contacto?.whatsapp || '').replace(/\D/g, '');
    return numero ? `https://wa.me/${numero}` : '';
  }

  editar() {
    if (!this.contacto) return;
    this.mensajeOk = ''; this.mensajeError = '';
    const { indicaciones, whatsapp, instagram, correo, direccion } = this.contacto;
    this.form.setValue({ indicaciones: indicaciones.join('\n'), whatsapp, instagram, correo, direccion });
    this.editando = true;
  }

  cancelar() {
    this.editando = false;
    this.mensajeError = '';
  }

  guardar() {
    this.mensajeOk = ''; this.mensajeError = '';
    if (this.form.invalid) { this.form.markAllAsTouched(); this.mensajeError = 'Las indicaciones y la dirección son obligatorias.'; return; }
    const v = this.form.value;
    const datos: Contacto = {
      indicaciones: String(v.indicaciones).split('\n').map((l: string) => l.trim()).filter(Boolean),
      whatsapp: v.whatsapp.trim(), instagram: v.instagram.trim(), correo: v.correo.trim(), direccion: v.direccion.trim(),
    };
    this.guardando = true;
    this.contenidoService.guardarContacto(datos).subscribe({
      next: (guardado) => {
        this.guardando = false;
        this.mostrar(guardado);
        this.editando = false;
        this.mensajeOk = 'Contacto actualizado.';
      },
      error: (msg: string) => { this.guardando = false; this.mensajeError = msg; }
    });
  }
}

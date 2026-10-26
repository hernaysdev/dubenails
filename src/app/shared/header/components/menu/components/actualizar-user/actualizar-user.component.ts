import { Component, OnInit } from '@angular/core';
import { UsuariosService } from 'src/app/services/usuarios.service';
import { SharedService } from 'src/app/services/shared.service';
import { EventsService } from 'src/app/services/events.service';
import { AbstractControl, FormGroup, FormBuilder, Validators } from '@angular/forms';

// Perfil: correo y telefono obligatorios; direccion opcional
// valida el correo sin considerar espacios al inicio o al final (el autocompletado del celular los agrega)
const correoValido = (c: AbstractControl) => Validators.email({ value: String(c.value ?? '').trim() } as AbstractControl);

@Component({
  selector: 'app-actualizar-user',
  templateUrl: './actualizar-user.component.html',
  styleUrls: ['./actualizar-user.component.scss']
})
export class ActualizarUserComponent implements OnInit {
  public formRegister: FormGroup;
  public usuario: any = null;
  public mensajeError = '';
  public mensajeOk = '';
  public enviando = false;
  constructor(
    private formBuilder: FormBuilder,
    private usuariosService: UsuariosService,
    private sharedService: SharedService,
    private eventsService: EventsService
  ) {
    this.formRegister = this.formBuilder.group({
      correo: ['', [Validators.required, correoValido]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{7,15}$/)]],
      direccion: [''],
    })
  }

  ngOnInit(): void {
    this.sharedService.getDataUsuario().subscribe((data: any) => {
      if (!data || data === true) return;
      this.usuario = data;
      this.formRegister.patchValue({ correo: data.correo, telefono: data.telefono ?? '', direccion: data.direccion ?? '' });
    })
  }

  invalido(campo: string) {
    const c = this.formRegister.get(campo);
    return !!c && c.invalid && c.touched;
  }

  enviar() {
    this.mensajeError = ''; this.mensajeOk = '';
    if (!this.usuario) return;
    if (this.formRegister.invalid) { this.formRegister.markAllAsTouched(); this.mensajeError = 'Revisa los campos marcados.'; return; }
    const { telefono, direccion, correo } = this.formRegister.value;
    // el alias no se cambia desde aqui; se envia el actual (la API lo valida)
    const body = { nombre: String(this.usuario.nombre).replace(/ /g, '_'), telefono, direccion, correo: correo.trim().toLowerCase() };
    this.enviando = true;
    this.usuariosService.actualizarUsuario(body, this.usuario.id).subscribe({
      next: () => {
        this.enviando = false;
        this.sharedService.setDataUsuario({ ...this.usuario, telefono, direccion, correo: body.correo });
        this.mensajeOk = 'Tus datos se guardaron.';
      },
      error: (err: any) => {
        this.enviando = false;
        this.mensajeError = typeof err === 'string' && err ? err : 'No pudimos guardar tus datos. Intenta de nuevo.';
      }
    })
  }
}

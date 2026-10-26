import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { UsuarioComponent } from './usuario.component';
import { Contacto, ContenidoService } from 'src/app/services/contenido.service';
import { SharedService } from 'src/app/services/shared.service';

describe('UsuarioComponent (Contacto editable)', () => {
  let c: UsuarioComponent;
  let contenido: jasmine.SpyObj<ContenidoService>;
  let shared: SharedService;
  const datos: Contacto = { indicaciones: ['Agenda desde la app.', 'Te confirmamos antes.'], whatsapp: '+1 (678) 206 4296', instagram: '', correo: '', direccion: '50 Starling Ct, Henrico, VA 23229' };

  beforeEach(() => {
    contenido = jasmine.createSpyObj('ContenidoService', ['contacto', 'guardarContacto']);
    contenido.contacto.and.returnValue(of({ ...datos }));
    TestBed.configureTestingModule({
      declarations: [UsuarioComponent],
      imports: [ReactiveFormsModule],
      providers: [{ provide: ContenidoService, useValue: contenido }, SharedService],
    }).overrideTemplate(UsuarioComponent, '');
    shared = TestBed.inject(SharedService);
    c = TestBed.createComponent(UsuarioComponent).componentInstance;
    c.ngOnInit();
  });

  it('muestra el contenido y arma el link de WhatsApp con solo digitos', () => {
    expect(c.contacto?.direccion).toContain('Henrico');
    expect(c.linkWhatsapp).toBe('https://wa.me/16782064296');
    expect(c.mapa).toBeTruthy();
  });

  it('solo la admin ve el boton de editar', () => {
    expect(c.esAdmin).toBeFalse();
    shared.setRolUser({ rol: 'admin' } as any);
    expect(c.esAdmin).toBeTrue();
  });

  it('editar carga el formulario con una indicacion por linea y guardar envia la lista', () => {
    contenido.guardarContacto.and.callFake((d: Contacto) => of(d));
    c.editar();
    expect(c.form.value.indicaciones).toBe('Agenda desde la app.\nTe confirmamos antes.');
    c.form.patchValue({ indicaciones: 'Nueva 1\n\n  Nueva 2  ', instagram: ' dubenails ' });
    c.guardar();
    expect(contenido.guardarContacto).toHaveBeenCalledWith(jasmine.objectContaining({ indicaciones: ['Nueva 1', 'Nueva 2'], instagram: 'dubenails' }));
    expect(c.editando).toBeFalse();
    expect(c.contacto?.indicaciones).toEqual(['Nueva 1', 'Nueva 2']);
    expect(c.mensajeOk).toContain('actualizado');
  });

  it('error de la API se muestra y sigue editando', () => {
    contenido.guardarContacto.and.returnValue(throwError(() => 'Escribe un correo válido.'));
    c.editar();
    c.guardar();
    expect(c.mensajeError).toBe('Escribe un correo válido.');
    expect(c.editando).toBeTrue();
  });
});

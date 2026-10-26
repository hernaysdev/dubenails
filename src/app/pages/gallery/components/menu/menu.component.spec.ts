import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { MenuComponent } from './menu.component';
import { DisponibilidadService } from 'src/app/services/disponibilidad.service';

describe('MenuComponent (servicios de la portada)', () => {
  let fixture: ComponentFixture<MenuComponent>;
  const servicios = [
    { id: 'e1', nombre: 'Esmaltado permanente', precio: 25, duracion: 1.5, descripcion: 'Color que dura 3 semanas.\nIncluye limado.' },
    { id: 'k1', nombre: 'Kapping', precio: 40, duracion: 1, descripcion: '' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuComponent],
      providers: [provideRouter([]), { provide: DisponibilidadService, useValue: { servicios: () => of(servicios) } }],
    }).compileComponents();
    fixture = TestBed.createComponent(MenuComponent);
    fixture.detectChanges();
  });

  const el = () => fixture.nativeElement as HTMLElement;
  const tarjetas = () => el().querySelectorAll<HTMLButtonElement>('button.servicio');

  it('las tarjetas no llevan a reservar ni muestran precios', () => {
    expect(tarjetas().length).toBe(2);
    expect(el().querySelector('.servicios a')).toBeNull();
    expect(el().textContent).not.toContain('$');
  });

  it('al tocar un servicio abre el modal con su descripcion y "Reservar ahora"', () => {
    tarjetas()[0].click();
    fixture.detectChanges();
    const modal = el().querySelector('[role="dialog"]')!;
    expect(modal.textContent).toContain('Esmaltado permanente');
    expect(modal.textContent).toContain('Color que dura 3 semanas.');
    const boton = modal.querySelector('a.reservar')!;
    expect(boton.textContent).toContain('Reservar ahora');
    expect(boton.getAttribute('href')).toContain('marcar=e1');
  });

  it('sin descripcion muestra un texto por defecto', () => {
    tarjetas()[1].click();
    fixture.detectChanges();
    expect(el().querySelector('.descripcion.vacia')).not.toBeNull();
  });

  it('se cierra con la X, tocando fuera o con Escape', () => {
    tarjetas()[0].click(); fixture.detectChanges();
    el().querySelector<HTMLButtonElement>('.cerrar')!.click(); fixture.detectChanges();
    expect(el().querySelector('[role="dialog"]')).toBeNull();

    tarjetas()[0].click(); fixture.detectChanges();
    el().querySelector<HTMLElement>('.fondo')!.click(); fixture.detectChanges();
    expect(el().querySelector('[role="dialog"]')).toBeNull();

    tarjetas()[0].click(); fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); fixture.detectChanges();
    expect(el().querySelector('[role="dialog"]')).toBeNull();
  });

  it('tocar dentro del modal no lo cierra', () => {
    tarjetas()[0].click(); fixture.detectChanges();
    el().querySelector<HTMLElement>('.modal h3')!.click(); fixture.detectChanges();
    expect(el().querySelector('[role="dialog"]')).not.toBeNull();
  });
});

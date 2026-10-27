import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AvisoNovedad, NovedadesService } from 'src/app/services/novedades.service';

// Aviso arriba de la pantalla cuando llega algo nuevo (cita o publicacion). Se va solo; al tocarlo abre la pantalla.
@Component({
  selector: 'app-aviso-novedades',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button type="button" class="aviso" *ngIf="actual" (click)="abrir()" role="status" aria-live="polite">
      <span class="punto" aria-hidden="true"></span>
      <span class="texto">{{ actual.texto }}</span>
      <span class="ver">Ver</span>
    </button>`,
  styles: [`
    .aviso { position: fixed; z-index: 2000; top: 72px; left: 50%; transform: translateX(-50%); width: calc(100% - 32px); max-width: 488px;
      display: flex; align-items: center; gap: 10px; padding: 12px 14px; border: 0; border-radius: 14px; background: #1d1a1d; color: #fff;
      font: inherit; font-size: 14px; text-align: left; box-shadow: 0 10px 30px rgba(0,0,0,.25); cursor: pointer; animation: bajar .25s ease-out; }
    .punto { width: 8px; height: 8px; border-radius: 50%; background: #2fd18a; flex: none; }
    .texto { flex: 1; }
    .ver { font-weight: 700; text-decoration: underline; }
    @keyframes bajar { from { opacity: 0; transform: translate(-50%, -12px); } to { opacity: 1; transform: translate(-50%, 0); } }
    @media (prefers-reduced-motion: reduce) { .aviso { animation: none; } }
  `]
})
export class AvisoNovedadesComponent implements OnInit, OnDestroy {
  actual: AvisoNovedad | null = null;
  private cola: AvisoNovedad[] = [];
  private sub?: Subscription;
  private timer: any;
  readonly DURACION = 6000;

  constructor(private novedades: NovedadesService, private router: Router) { }

  ngOnInit() {
    this.sub = this.novedades.aviso$.subscribe(a => { this.cola.push(a); if (!this.actual) this.siguiente(); });
  }

  ngOnDestroy() { this.sub?.unsubscribe(); clearTimeout(this.timer); }

  private siguiente() {
    this.actual = this.cola.shift() || null;
    clearTimeout(this.timer);
    if (this.actual) this.timer = setTimeout(() => this.siguiente(), this.DURACION);
  }

  abrir() {
    const ruta = this.actual?.ruta;
    this.cola = [];
    this.siguiente();
    if (ruta) this.router.navigate([ruta]);
  }
}

import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PagoElegido } from 'src/app/services/agenda.service';
import { MedioPago } from 'src/app/services/contenido.service';
import { formatoDinero } from 'src/app/services/disponibilidad.service';

export interface OpcionPago { porcentaje: number; monto: number; }

const MAX_MB = 10;
const TIPOS = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

// montos de cada porcentaje sobre el total (igual que la API: redondeo a centavos)
export const opcionesDePago = (total: number, porcentajes: number[]): OpcionPago[] =>
  porcentajes.map(porcentaje => ({ porcentaje, monto: Math.round(total * porcentaje) / 100 }));

// mismo formato que el resto de la app
export const dinero = formatoDinero;

// Pago con captura: cuanto paga (anticipo o total), por cual medio (con sus datos) y la captura.
// Emite el pago completo o null mientras falte algo.
@Component({
  selector: 'app-pago',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pago.component.html',
  styleUrls: ['./pago.component.scss']
})
export class PagoComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) opciones: OpcionPago[] = [];
  @Input({ required: true }) medios: MedioPago[] = [];
  @Input() total = 0;
  @Output() cambio = new EventEmitter<PagoElegido | null>();

  porcentaje: number | null = null;
  medio: MedioPago | null = null;
  archivo: File | null = null;
  vistaPrevia: string | null = null;
  error = '';
  copiado = false;
  readonly dinero = dinero;

  ngOnChanges() {
    // con un solo medio no hay nada que elegir
    if (this.medios.length === 1 && !this.medio) this.medio = this.medios[0];
  }

  ngOnDestroy() { this.soltarVistaPrevia(); }

  elegirPorcentaje(p: number) { this.porcentaje = p; this.emitir(); }
  elegirMedio(m: MedioPago) { this.medio = m; this.copiado = false; this.emitir(); }

  get montoElegido() { return this.opciones.find(o => o.porcentaje === this.porcentaje)?.monto ?? 0; }
  get resta() { return Math.max(0, Math.round((this.total - this.montoElegido) * 100) / 100); }

  async copiarDatos() {
    if (!this.medio) return;
    try { await navigator.clipboard.writeText(this.medio.datos); this.copiado = true; } catch { this.copiado = false; }
  }

  elegirArchivo(evento: Event) {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0] || null;
    this.error = '';
    if (!archivo) return;
    // algunos iPhone no informan el tipo del HEIC: se acepta por la extension
    const tipoOk = TIPOS.includes(archivo.type) || /\.(heic|heif)$/i.test(archivo.name);
    if (!tipoOk) { this.error = 'La captura debe ser una imagen (JPG, PNG, WEBP o HEIC).'; input.value = ''; return; }
    if (archivo.size > MAX_MB * 1024 * 1024) { this.error = `La imagen pesa más de ${MAX_MB} MB.`; input.value = ''; return; }
    this.soltarVistaPrevia();
    this.archivo = archivo;
    this.vistaPrevia = archivo.type.startsWith('image/') && !/heic|heif/i.test(archivo.type) ? URL.createObjectURL(archivo) : null;
    this.emitir();
  }

  quitarArchivo() {
    this.soltarVistaPrevia();
    this.archivo = null;
    this.emitir();
  }

  private soltarVistaPrevia() {
    if (this.vistaPrevia) URL.revokeObjectURL(this.vistaPrevia);
    this.vistaPrevia = null;
  }

  private emitir() {
    const completo = this.porcentaje !== null && this.medio && this.archivo;
    this.cambio.emit(completo ? { porcentaje: this.porcentaje!, medio: this.medio!.id, archivo: this.archivo! } : null);
  }
}

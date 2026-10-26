import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LinkConfirmacion } from 'src/app/services/agenda.service';

// Panel de la admin para mandar el link de confirmacion: WhatsApp (mensaje ya escrito) o copiar
@Component({
  selector: 'app-compartir-link',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './compartir-link.component.html',
  styleUrls: ['./compartir-link.component.scss']
})
export class CompartirLinkComponent {
  @Input({ required: true }) link!: LinkConfirmacion;
  @Input() clienta = '';
  @Output() cerrar = new EventEmitter<void>();
  copiado = false;

  async copiar() {
    try {
      await navigator.clipboard.writeText(this.link.mensaje);
      this.copiado = true;
    } catch {
      this.copiado = false;
    }
  }
}

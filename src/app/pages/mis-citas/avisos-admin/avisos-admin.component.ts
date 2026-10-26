import { Component, OnInit } from '@angular/core';
import { NotificacionesService } from 'src/app/services/notificaciones.service';

type Estado = 'cargando' | 'este' | 'otro' | 'ninguno' | 'no-soportado';

// Tarjeta en "Todas las reservas": activar en este dispositivo los avisos de citas nuevas, cancelaciones y cambios
@Component({
  selector: 'app-avisos-admin',
  templateUrl: './avisos-admin.component.html',
  styleUrls: ['./avisos-admin.component.scss']
})
export class AvisosAdminComponent implements OnInit {
  estado: Estado = 'cargando';
  ocupado = false;
  error = '';
  aviso = '';

  constructor(private notificaciones: NotificacionesService) { }

  ngOnInit(): void {
    if (!this.notificaciones.soportadas) { this.estado = 'no-soportado'; return; }
    this.notificaciones.estado().subscribe({
      next: async ({ activas, endpoint }) => {
        const local = await this.notificaciones.endpointLocal();
        this.estado = !activas ? 'ninguno' : (local && local === endpoint ? 'este' : 'otro');
      },
      error: () => this.estado = 'ninguno',
    });
  }

  async activar() {
    this.error = ''; this.aviso = '';
    if (this.notificaciones.permisoBloqueado) {
      this.error = 'Las notificaciones están bloqueadas para dubenails.com. Permítelas en los ajustes del navegador y vuelve a intentar.';
      return;
    }
    this.ocupado = true;
    try {
      await this.notificaciones.activar();
      this.estado = 'este';
      this.aviso = 'Listo. Te enviamos una notificación de prueba.';
    } catch (e: any) {
      this.error = typeof e === 'string' ? e : 'No pudimos activar las notificaciones en este dispositivo.';
    } finally {
      this.ocupado = false;
    }
  }

  probar() {
    this.error = ''; this.aviso = '';
    this.ocupado = true;
    this.notificaciones.probar().subscribe({
      next: () => { this.ocupado = false; this.aviso = 'Notificación de prueba enviada.'; },
      error: (msg: string) => { this.ocupado = false; this.error = msg || 'No pudimos enviar la prueba.'; },
    });
  }
}

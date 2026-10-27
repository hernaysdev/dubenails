import { Component, HostListener, OnInit } from '@angular/core';
import { UpdateService } from './services/update.service';
import { AgendaService } from './services/agenda.service';
import { NovedadesService } from './services/novedades.service';

// 60px de margen superior del contenido (cabecera fija) + 80px de la barra inferior
const ALTO_CABECERA_Y_PIE = 140;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'duberlys';
  public respuesta: any;
  public iphoneFooter: boolean = false;
  readonly VAPID_PUBLIC_KEY = 'BBG9Ywk7mvin-aXmEpLorIVjGeo_8cahwFMYXqFD1VKsCldi_dAYXssJ5moV2pe3vcdqzCtXWS4ru8jn9UlGlrs';
  alturaContent: any;
  altura: any;

  constructor(
    private sw: UpdateService,
    private _agendaService: AgendaService,
    private novedades: NovedadesService
  ) {
    // check the service worker for updates
    this.sw.checkForUpdates();
  }

  ngOnInit(): void {
    this.calcularAlturas();
    // citas y publicaciones nuevas sin recargar (cada 30 s con la app en pantalla)
    this.novedades.iniciar();
  }

  ngAfterViewInit(): void {
    this._agendaService.checkAgenda();
  }

  // alto visible de la ventana (antes screen.height: el alto de la pantalla del dispositivo, que en
  // navegadores con barras o ventanas mas chicas dejaba un bloque en blanco al final del scroll).
  // Se calcula en ngOnInit para no cambiar valores despues del primer render (NG0100).
  @HostListener('window:resize')
  calcularAlturas() {
    const alto = window.innerHeight;
    this.altura = String(alto);
    this.alturaContent = String(alto - ALTO_CABECERA_Y_PIE);
  }

}

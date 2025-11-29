import { Component } from '@angular/core';
import { UpdateService } from './services/update.service';
import { AgendaService } from './services/agenda.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'duberlys';
  public respuesta: any;
  public iphoneFooter: boolean = false;
  readonly VAPID_PUBLIC_KEY = 'BBG9Ywk7mvin-aXmEpLorIVjGeo_8cahwFMYXqFD1VKsCldi_dAYXssJ5moV2pe3vcdqzCtXWS4ru8jn9UlGlrs';
  alturaContent: any;
  altura: any;

  constructor(
    private sw: UpdateService,
    private _agendaService: AgendaService
  ) {
    // check the service worker for updates
    this.sw.checkForUpdates();
  }

  ngAfterViewInit(): void {
    this.altura = String(window.screen.height);
    this.alturaContent = String(window.screen.height - 140 - 40);
    this._agendaService.checkAgenda();

  }

}

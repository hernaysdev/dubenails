import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { Observable, catchError, firstValueFrom, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';

export const VAPID_PUBLIC_KEY = 'BBG9Ywk7mvin-aXmEpLorIVjGeo_8cahwFMYXqFD1VKsCldi_dAYXssJ5moV2pe3vcdqzCtXWS4ru8jn9UlGlrs';

// Notificaciones push de la admin: se activan en un dispositivo (el ultimo que las activa es el que las recibe)
@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private url = `${environment.urlLocal}api/notificacion`;

  constructor(private http: HttpClient, private swPush: SwPush) { }

  // el navegador puede recibir push (service worker activo y API de notificaciones)
  get soportadas(): boolean {
    return this.swPush.isEnabled && typeof Notification !== 'undefined';
  }

  get permisoBloqueado(): boolean {
    return typeof Notification !== 'undefined' && Notification.permission === 'denied';
  }

  estado(): Observable<{ activas: boolean; endpoint: string | null }> {
    return this.http.get<{ activas: boolean; endpoint: string | null }>(`${this.url}/estado`);
  }

  // suscripcion de este dispositivo, si ya dio permiso antes
  async endpointLocal(): Promise<string | null> {
    if (!this.soportadas) return null;
    const sub = await firstValueFrom(this.swPush.subscription);
    return sub?.endpoint || null;
  }

  // pide permiso, registra este dispositivo y manda una notificacion de prueba
  async activar(): Promise<void> {
    const sub = await this.swPush.requestSubscription({ serverPublicKey: VAPID_PUBLIC_KEY });
    await firstValueFrom(this.http.post(this.url, sub.toJSON()).pipe(catchError(e => throwError(() => e.error?.msg))));
    await firstValueFrom(this.probar());
  }

  probar(): Observable<any> {
    return this.http.post(`${this.url}/prueba`, {}).pipe(catchError(e => throwError(() => e.error?.msg)));
  }
}

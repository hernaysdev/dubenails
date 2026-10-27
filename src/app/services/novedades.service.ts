import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { SIN_SPINNER } from '../interceptores/interceptor';
import { SpinnerService } from './interceptor.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SharedService } from './shared.service';
import { formatoHora } from './disponibilidad.service';

export interface AvisoNovedad { texto: string; ruta: string; }
export type Cambio = 'agenda' | 'muro';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const CLAVE_MURO = 'muroVisto';

// Pregunta a la API cada 30 s que cambio (solo con la app en pantalla) y al volver a primer plano.
// Las pantallas se suscriben a cambios$ para recargarse; el menu muestra los globos; aviso$ el mensaje.
@Injectable({ providedIn: 'root' })
export class NovedadesService implements OnDestroy {
  readonly INTERVALO = 30000;
  private url = `${environment.urlLocal}api/novedades`;
  private desde = Date.now();
  private huella: string | null = null;
  private sesion: string | null = null;
  private timer: any = null;
  private consultando = false;

  readonly citasNuevas$ = new BehaviorSubject<number>(0);
  readonly muroNuevos$ = new BehaviorSubject<number>(0);
  readonly cambios$ = new Subject<Cambio>();
  readonly aviso$ = new Subject<AvisoNovedad>();

  constructor(private http: HttpClient, private shared: SharedService, private zona: NgZone, private spinner: SpinnerService) { }

  iniciar() {
    if (this.timer) return;
    // primera vez: el Muro cuenta desde ahora (no todas las publicaciones antiguas)
    if (!this.leerMuroVisto()) this.guardarMuroVisto(Date.now());
    document.addEventListener('visibilitychange', this.alVolver);
    // fuera de la zona de Angular: el intervalo no dispara deteccion de cambios por si solo
    this.zona.runOutsideAngular(() => {
      this.timer = setInterval(() => { if (document.visibilityState === 'visible') this.zona.run(() => this.consultar()); }, this.INTERVALO);
    });
    this.consultar();
  }

  ngOnDestroy() {
    clearInterval(this.timer);
    document.removeEventListener('visibilitychange', this.alVolver);
  }

  private alVolver = () => { if (document.visibilityState === 'visible') this.zona.run(() => this.consultar()); };

  consultar() {
    if (this.consultando) return;
    // al cambiar de sesion (entrar, salir, otra cuenta) se empieza de cero
    const token = localStorage.getItem('token');
    if (token !== this.sesion) { this.sesion = token; this.huella = null; this.citasNuevas$.next(0); }
    this.consultando = true;
    const muro = this.leerMuroVisto() || Date.now();
    const params: any = { desde: this.desde, muro };
    // la autorecarga pasa desapercibida: sin spinner
    this.http.get<any>(this.url, { params, context: new HttpContext().set(SIN_SPINNER, true) }).subscribe({
      next: (r) => { this.consultando = false; this.procesar(r, muro); },
      error: () => { this.consultando = false; },
    });
  }

  private procesar(r: any, muroEnviado: number) {
    const primera = this.huella === null;
    this.desde = r.ahora || Date.now();

    // si abrio el Muro mientras la consulta viajaba, ese conteo ya esta visto
    this.muroNuevos$.next(this.leerMuroVisto() > muroEnviado ? 0 : (r.articulos?.nuevos || 0));
    const yo = this.shared.getRolUser().getValue()?.id;
    const ajenos = (r.articulos?.recientes || []).filter((a: any) => String(a.usuario) !== String(yo));
    if (r.articulos?.recientes?.length) this.avisarCambio('muro');
    if (ajenos.length) this.aviso$.next({ texto: ajenos.length === 1 ? `${ajenos[0].nombre} publicó en el Muro` : `${ajenos.length} publicaciones nuevas en el Muro`, ruta: '/articulos' });

    if (r.citas) {
      if (!primera && r.citas.huella !== this.huella) this.avisarCambio('agenda');
      this.huella = r.citas.huella;
      this.citasNuevas$.next(r.citas.nuevas || 0);
      for (const c of (r.citas.recientes || []).slice(0, 3)) {
        this.aviso$.next({ texto: `Nueva cita: ${c.nombre} · ${c.dia} ${MESES[c.mes] || ''}, ${formatoHora(c.hora)}`, ruta: '/mis-citas' });
      }
    } else {
      this.huella = '';
    }
  }

  // las pantallas se recargan solas: esas peticiones tampoco muestran spinner
  private avisarCambio(c: Cambio) {
    this.spinner.silenciar(4000);
    this.cambios$.next(c);
  }

  // la clienta abrio el Muro: el globo vuelve a cero
  marcarMuroVisto() { this.guardarMuroVisto(Date.now()); this.muroNuevos$.next(0); }

  private leerMuroVisto(): number { try { return Number(localStorage.getItem(CLAVE_MURO)) || 0; } catch { return 0; } }
  private guardarMuroVisto(ms: number) { try { localStorage.setItem(CLAVE_MURO, String(ms)); } catch { } }
}

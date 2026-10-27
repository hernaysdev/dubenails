import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, tap } from "rxjs";
import { environment } from "src/environments/environment";

// { uid, exp } del token de sesion (los antiguos son solo el id entre comillas y no vencen)
export const leerToken = (token: string | null): { uid: string, exp: number } | null => {
    try {
        const base64 = token!.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const datos = JSON.parse(atob(base64));
        if (typeof datos === 'string') return { uid: datos.replace(/"/g, ''), exp: 0 };
        return datos?.uid ? { uid: String(datos.uid), exp: Number(datos.exp) || 0 } : null;
    } catch {
        return null;
    }
};

// agrega el token de sesion a las llamadas a nuestra API que no lo envian
// (perfil, foto, muro, notificaciones). No pisa el header si el servicio ya lo puso.
// La sesion vence a los 30 dias: mientras se usa la app, la API manda uno nuevo en X-Token-Nuevo y se guarda.
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const token = localStorage.getItem('token');
        const esNuestraApi = req.url.startsWith(`${environment.urlLocal}api/`);
        if (!esNuestraApi) return next.handle(req);
        const conToken = token && !req.headers.has('authorization')
            ? req.clone({ setHeaders: { authorization: token } })
            : req;
        const enviado = conToken.headers.get('authorization');
        return next.handle(conToken).pipe(tap(evento => {
            if (evento instanceof HttpResponse) this.guardarRenovado(enviado, evento.headers.get('X-Token-Nuevo'));
        }));
    }

    // solo si sigue la misma sesion (pudo cerrarla o entrar con otra cuenta mientras la llamada iba en camino),
    // el token nuevo es de la misma cuenta y vence despues (una respuesta guardada en cache podria traer uno viejo)
    private guardarRenovado(enviado: string | null, nuevo: string | null) {
        if (!nuevo || !enviado || localStorage.getItem('token') !== enviado) return;
        const antes = leerToken(enviado);
        const despues = leerToken(nuevo);
        if (!antes || !despues || despues.uid !== antes.uid || despues.exp <= antes.exp) return;
        localStorage.setItem('token', nuevo);
    }
}

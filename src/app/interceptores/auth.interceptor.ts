import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";

// agrega el token de sesion a las llamadas a nuestra API que no lo envian
// (perfil, foto, muro, notificaciones). No pisa el header si el servicio ya lo puso.
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const token = localStorage.getItem('token');
        const esNuestraApi = req.url.startsWith(`${environment.urlLocal}api/`);
        if (!token || !esNuestraApi || req.headers.has('authorization')) {
            return next.handle(req);
        }
        return next.handle(req.clone({ setHeaders: { authorization: token } }));
    }
}

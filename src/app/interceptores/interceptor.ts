import { HttpContextToken, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { defer, finalize, Observable } from "rxjs";
import { SpinnerService } from "../services/interceptor.service";

// marca una peticion para que no muestre el spinner (ej. la consulta de novedades cada 30 s)
export const SIN_SPINNER = new HttpContextToken<boolean>(() => false);

@Injectable()
export class SpinnerInterceptor implements HttpInterceptor {
    constructor(
        public spinnerService : SpinnerService
    ){}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // sin spinner: marcadas, el autocompletado de clientas y las recargas automaticas
        // (antes 'usuarios-express' no lo mostraba pero si lo ocultaba)
        const silenciosa = req.context.get(SIN_SPINNER) || req.url.includes('usuarios-express') || this.spinnerService.silenciado;
        if (silenciosa) return next.handle(req);
        this.spinnerService.show();
        // defer: si la peticion falla antes de salir (ej. un header en null), igual se descuenta.
        // Sin esto el spinner quedaba pegado para siempre (link de confirmar sin sesion)
        return defer(() => next.handle(req)).pipe(
            finalize(() => this.spinnerService.hide())
        )
    }
}

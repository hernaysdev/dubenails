import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { finalize, Observable } from "rxjs";
import { SpinnerService } from "../services/interceptor.service";


@Injectable()

export class SpinnerInterceptor implements HttpInterceptor {
    constructor(
        public spinnerService : SpinnerService
    ){}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        console.log('interceptor', req.url.includes('usuarios-express'))
        if(req.url.includes('usuarios-express')){

        }else{
            this.spinnerService.show();
        }

        return next.handle(req).pipe(
            finalize(() => this.spinnerService.hide())
        )
    }
}
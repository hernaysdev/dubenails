import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { SpinnerComponent } from './spinner.component';
import { SpinnerInterceptor } from 'src/app/interceptores/interceptor';
import { AuthInterceptor } from 'src/app/interceptores/auth.interceptor';


@NgModule({
  declarations: [
    SpinnerComponent
  ],
  imports: [
    CommonModule,
    HttpClientModule,

  ],
  exports:[
    SpinnerComponent
  ],
  providers: [
    {provide : HTTP_INTERCEPTORS , useClass : SpinnerInterceptor , multi : true},
    {provide : HTTP_INTERCEPTORS , useClass : AuthInterceptor , multi : true},
  ],
})
export class SpinnerModule { }

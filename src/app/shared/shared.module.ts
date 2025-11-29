import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import { ContentComponent } from './content/content.component';
import { AppRoutingModule } from '../app-routing.module';
import { MenuComponent } from './header/components/menu/menu.component';
import { TituloComponent } from './header/components/titulo/titulo.component';
import { RegistroComponent } from './header/components/menu/components/registro/registro.component';
import { LoginComponent } from './header/components/menu/components/login/login.component';
import { ActualizarUserComponent } from './header/components/menu/components/actualizar-user/actualizar-user.component';
import { ActualizarFotoComponent } from './header/components/menu/components/actualizar-foto/actualizar-foto.component';
import { SpinnerModule } from './spinner/spinner.module';
import { RegistrarArticulosComponent } from './header/components/menu/components/registrar-articulos/registrar-articulos.component';
import { GiftcardComponent } from './header/components/menu/components/giftcard/giftcard.component';
import { RecuperarClaveComponent } from "./header/components/menu/components/recuperar-clave/recuperar-clave.component";



@NgModule({
  declarations: [
    FooterComponent,
    HeaderComponent,
    FooterComponent,
    ContentComponent,
    MenuComponent,
    TituloComponent,
    RegistroComponent,
    LoginComponent,
    ActualizarUserComponent,
    RegistrarArticulosComponent,
    ActualizarFotoComponent,
    GiftcardComponent
  ],
  imports: [
    CommonModule,
    AppRoutingModule,
    ReactiveFormsModule,
    SpinnerModule,
    FormsModule,
    RecuperarClaveComponent
],
  exports:[
    FooterComponent,
    HeaderComponent,
    ContentComponent,
    RegistroComponent
  ],
  schemas:[
    CUSTOM_ELEMENTS_SCHEMA
  ]
})
export class SharedModule { }

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from "@angular/router";
import { GiftcardComponent } from './giftcard.component';


const giftCardRouter: Routes = [
    {
        path: '',
        component: GiftcardComponent,
    },
    {
        path: 'Esmaltado_Permanente/:nombrePara/:nombreDe',
        component: GiftcardComponent
    },
    {
        path: 'Acrilicas/:nombrePara/:nombreDe',
        component: GiftcardComponent
    }
    ,
    {
        path: 'Polygel/:nombrePara/:nombreDe',
        component: GiftcardComponent
    }

]

@NgModule({
    imports: [RouterModule.forChild(giftCardRouter)],
    exports: [RouterModule]
})


export class GiftCardRouter { };


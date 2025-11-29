import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GiftCardRouter } from './giftcard-routing-module';
import { GiftcardComponent } from './giftcard.component';

@NgModule({
  declarations: [
    GiftcardComponent
  ],
  imports: [
    CommonModule,
    GiftCardRouter
  ]
})
export class GiftcardModule { }

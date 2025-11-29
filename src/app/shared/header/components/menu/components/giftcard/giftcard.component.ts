import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-giftcard',
  templateUrl: './giftcard.component.html',
  styleUrls: ['./giftcard.component.scss']
})
export class GiftcardComponent implements OnInit {

  @ViewChild('copiar' , {static:true} )  copiar! : ElementRef;

  //  https://dubenails.com
  public url :string  = '';
  public urlStatic : string = 'https://dubenails.com/giftcard/';
  public opts = ['Esmaltado_Permanente','Polygel','Acrilicas'];
  public productoSelect : string = '';
  public copiado : string = '';
  public nombrePara : any = '';
  public nombreDe : any = '';
  constructor() { }

  ngOnInit(): void {
  }

  producto(producto:string){
    this.url = '';
    const nombrePara = (this.nombrePara) ? '/'+this.nombrePara : '/'+'null';
    const nombreDe = (this.nombreDe) ? '/'+this.nombreDe : '/'+'null';
    this.url = this.urlStatic + producto + nombrePara + nombreDe;
    this.productoSelect = producto;
    this.copiado = '';
  }

  urls(){
    let selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = this.url;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);

    this.copiado = 'copiado';
  }

}

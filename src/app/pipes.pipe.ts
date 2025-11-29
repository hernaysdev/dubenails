import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'pipes'
})
export class PipesPipe implements PipeTransform {

  transform(numero: any) {
    const string = 
    (String(numero).length > 2 ) 
    ? String(numero).slice(0, String(numero).length-2)+':30' 
    : String(numero)+':00';
     
    return string;
  }

}

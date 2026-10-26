import { Pipe, PipeTransform } from '@angular/core';
import { formatoDinero } from 'src/app/services/disponibilidad.service';

// {{ 40 | dinero }} -> "$40"; {{ 10.5 | dinero }} -> "$10.50"; {{ 1250 | dinero }} -> "$1,250"
@Pipe({ name: 'dinero', standalone: true })
export class DineroPipe implements PipeTransform {
  transform(valor: number | string | null | undefined): string {
    return formatoDinero(valor);
  }
}

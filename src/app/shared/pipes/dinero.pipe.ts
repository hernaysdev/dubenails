import { Pipe, PipeTransform } from '@angular/core';
import { formatoDinero } from 'src/app/services/disponibilidad.service';

// {{ 18000 | dinero }} -> "$18.000" (pesos chilenos)
@Pipe({ name: 'dinero', standalone: true })
export class DineroPipe implements PipeTransform {
  transform(valor: number | string | null | undefined): string {
    return formatoDinero(valor);
  }
}

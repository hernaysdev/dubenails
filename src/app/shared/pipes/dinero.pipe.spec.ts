import { DineroPipe } from './dinero.pipe';
import { formatoDinero } from 'src/app/services/disponibilidad.service';

describe('formato de montos', () => {
  it('dolares con separador de miles y centavos solo si hay', () => {
    const p = new DineroPipe();
    expect(p.transform(40)).toBe('$40');
    expect(p.transform(10.5)).toBe('$10.50');
    expect(p.transform(1250)).toBe('$1,250');
    expect(p.transform('6')).toBe('$6');
    expect(p.transform(null)).toBe('$0');
    expect(formatoDinero(6.004)).toBe('$6');
  });
});

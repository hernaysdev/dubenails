import { DineroPipe } from './dinero.pipe';
import { formatoDinero } from 'src/app/services/disponibilidad.service';

describe('formato de montos', () => {
  it('pesos chilenos: punto de miles y sin decimales', () => {
    const p = new DineroPipe();
    expect(p.transform(18000)).toBe('$18.000');
    expect(p.transform(2700)).toBe('$2.700');
    expect(p.transform(428000)).toBe('$428.000');
    expect(p.transform('6')).toBe('$6');
    expect(p.transform(null)).toBe('$0');
    expect(formatoDinero(3450.4)).toBe('$3.450');
  });
});

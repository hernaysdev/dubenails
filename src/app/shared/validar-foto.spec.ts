import { problemaFoto } from './validar-foto';

describe('problemaFoto (al elegir la foto)', () => {
  it('acepta una foto normal, incluso HEIC sin tipo', () => {
    expect(problemaFoto(new File(['x'], 'a.jpg', { type: 'image/jpeg' }))).toBe('');
    expect(problemaFoto(new File(['x'], 'IMG_1.HEIC', { type: '' }))).toBe('');
  });

  it('avisa si llega vacia (foto en la nube), si no es imagen o si no hay foto', () => {
    expect(problemaFoto(new File([], 'nube.jpg', { type: 'image/jpeg' }))).toContain('vacía');
    expect(problemaFoto(new File(['x'], 'doc.pdf', { type: 'application/pdf' }))).toContain('no es una foto');
    expect(problemaFoto(null)).toContain('Elige');
  });
});

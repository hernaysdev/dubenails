import { comprimirImagen, PARA_MURO } from './comprimir-imagen';

// imagen de prueba generada en el navegador (como una foto grande del telefono)
const fotoGrande = async (ancho: number, alto: number, tipo = 'image/png'): Promise<File> => {
  const canvas = document.createElement('canvas');
  canvas.width = ancho; canvas.height = alto;
  const ctx = canvas.getContext('2d')!;
  for (let i = 0; i < 40; i++) { ctx.fillStyle = `hsl(${i * 9}, 70%, 60%)`; ctx.fillRect((i * 97) % ancho, (i * 53) % alto, ancho / 3, alto / 3); }
  const blob: Blob = await new Promise(ok => canvas.toBlob(b => ok(b!), tipo));
  return new File([blob], 'IMG_0001.png', { type: tipo });
};

const medidas = (archivo: File): Promise<[number, number]> => new Promise(ok => {
  const img = new Image();
  img.onload = () => ok([img.naturalWidth, img.naturalHeight]);
  img.src = URL.createObjectURL(archivo);
});

describe('comprimirImagen', () => {
  it('achica la foto (lado mayor 1600) y la entrega como JPG mas liviano', async () => {
    const original = await fotoGrande(3000, 2000);
    const comprimida = await comprimirImagen(original, PARA_MURO);
    expect(comprimida.type).toBe('image/jpeg');
    expect(comprimida.name).toBe('IMG_0001.jpg');
    expect(comprimida.size).toBeLessThan(original.size);
    expect(await medidas(comprimida)).toEqual([1600, 1067]);
  });

  it('si el navegador no puede abrirla, devuelve la original', async () => {
    const rara = new File(['no es una imagen'], 'rara.heic', { type: 'image/heic' });
    expect(await comprimirImagen(rara, PARA_MURO)).toBe(rara);
  });
});

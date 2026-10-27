// Comprime una foto en el navegador antes de subirla: la achica (lado mayor) y la guarda como JPG.
// Asi cualquier foto sirve (HEIC del iPhone, Live Photos, fotos de 10 MB): al servidor llega un JPG liviano.
// Si el navegador no puede abrirla, se devuelve la original.

export interface OpcionesCompresion { ladoMaximo: number; calidad: number; }

export const PARA_MURO: OpcionesCompresion = { ladoMaximo: 1600, calidad: 0.82 };
// el comprobante de pago tiene que leerse bien (montos, numeros)
export const PARA_COMPROBANTE: OpcionesCompresion = { ladoMaximo: 2000, calidad: 0.85 };
export const PARA_PERFIL: OpcionesCompresion = { ladoMaximo: 600, calidad: 0.85 };

const abrir = (archivo: File): Promise<HTMLImageElement> => new Promise((ok, falla) => {
  const url = URL.createObjectURL(archivo);
  const img = new Image();
  img.onload = () => { URL.revokeObjectURL(url); ok(img); };
  img.onerror = () => { URL.revokeObjectURL(url); falla(new Error('no se pudo abrir la imagen')); };
  img.src = url;
});

export const comprimirImagen = async (archivo: File, { ladoMaximo, calidad }: OpcionesCompresion): Promise<File> => {
  try {
    const img = await abrir(archivo);
    const escala = Math.min(1, ladoMaximo / Math.max(img.naturalWidth, img.naturalHeight));
    const ancho = Math.max(1, Math.round(img.naturalWidth * escala));
    const alto = Math.max(1, Math.round(img.naturalHeight * escala));
    const canvas = document.createElement('canvas');
    canvas.width = ancho; canvas.height = alto;
    const ctx = canvas.getContext('2d');
    if (!ctx) return archivo;
    // fondo blanco: las PNG con transparencia no quedan negras al pasar a JPG
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, ancho, alto);
    ctx.drawImage(img, 0, 0, ancho, alto);
    const blob: Blob | null = await new Promise(ok => canvas.toBlob(ok, 'image/jpeg', calidad));
    if (!blob || !blob.size) return archivo;
    // si la original ya era chica y liviana, se queda la original
    if (blob.size >= archivo.size && escala === 1 && /jpe?g/i.test(archivo.type)) return archivo;
    const nombre = (archivo.name || 'foto').replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], nombre, { type: 'image/jpeg', lastModified: Date.now() });
  } catch {
    return archivo;
  }
};

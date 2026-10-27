// Revisa la foto apenas se elige (antes de subirla). Devuelve un mensaje si no sirve.
// Una foto que esta solo en la nube (Google Fotos, iCloud) a veces llega vacia desde el navegador.
export const MAX_MB_FOTO = 15;

export const problemaFoto = (archivo: File | null | undefined): string => {
  if (!archivo) return 'Elige una foto.';
  if (!archivo.size) return 'La foto llegó vacía. Si está en la nube (Google Fotos, iCloud), descárgala al teléfono y vuelve a elegirla.';
  const esImagen = archivo.type.startsWith('image/') || /\.(heic|heif|jpe?g|png|webp|gif|avif)$/i.test(archivo.name);
  if (!esImagen) return 'Ese archivo no es una foto (JPG, PNG, WEBP o HEIC).';
  if (archivo.size > MAX_MB_FOTO * 1024 * 1024) return `La foto pesa más de ${MAX_MB_FOTO} MB.`;
  return '';
};

// si el servidor no responde en este tiempo, la app deja de esperar y lo dice
export const ESPERA_SUBIDA_MS = 45000;

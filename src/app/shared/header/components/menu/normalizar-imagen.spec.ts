import { IMG_DEFAULT, normalizarImagen } from './menu.component';

describe('normalizarImagen (foto de perfil)', () => {
  it('foto de Google: se pide en 400px (en 96px se veia pixelada) y sin agregarle .jpg', () => {
    expect(normalizarImagen('https://lh3.googleusercontent.com/a/ACg8ocKxyz123=s96-c')).toBe('https://lh3.googleusercontent.com/a/ACg8ocKxyz123=s400-c');
    expect(normalizarImagen('https://lh3.googleusercontent.com/a/ACg8ocKxyz123')).toBe('https://lh3.googleusercontent.com/a/ACg8ocKxyz123');
  });

  it('foto de Cloudinary se sigue normalizando a .jpg', () => {
    const cloud = 'https://res.cloudinary.com/mas58/image/upload/v1721692094/usuariosPerfil/tmp-2-1721692094727_cfyyxz.png';
    expect(normalizarImagen(cloud)).toBe('https://res.cloudinary.com/mas58/image/upload/v1721692094/usuariosPerfil/tmp-2-1721692094727_cfyyxz.jpg');
  });

  it('sin foto usa el icono por defecto', () => {
    expect(normalizarImagen(null)).toBe(IMG_DEFAULT);
    expect(normalizarImagen('')).toBe(IMG_DEFAULT);
  });
});

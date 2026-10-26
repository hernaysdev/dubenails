import { IMG_DEFAULT, normalizarImagen } from './menu.component';

describe('normalizarImagen (foto de perfil)', () => {
  it('foto de Google se usa tal cual (antes le agregaba .jpg y quedaba rota)', () => {
    const google = 'https://lh3.googleusercontent.com/a/ACg8ocKxyz123=s96-c';
    expect(normalizarImagen(google)).toBe(google);
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

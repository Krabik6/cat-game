import Phaser from 'phaser';
import { RENDER_SCALE } from '../config';

/**
 * Растеризует SVG-строки в текстуры в RENDER_SCALE раз крупнее,
 * чтобы на экранах высокой плотности картинка оставалась чёткой.
 * Размер SVG указывается в единицах мира через viewBox.
 */
export async function addSvgTextures(scene: Phaser.Scene, entries: Record<string, string>) {
  await Promise.all(
    Object.entries(entries).map(
      ([key, svg]) =>
        new Promise<void>((resolve, reject) => {
          const vb = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
          if (!vb) throw new Error(`SVG without viewBox: ${key}`);
          const w = Math.ceil(+vb[1] * RENDER_SCALE);
          const h = Math.ceil(+vb[2] * RENDER_SCALE);
          const sized = svg.replace('<svg ', `<svg width="${w}" height="${h}" `);
          const img = new Image();
          img.onload = () => {
            if (scene.textures.exists(key)) scene.textures.remove(key);
            scene.textures.addImage(key, img);
            resolve();
          };
          img.onerror = () => reject(new Error(`SVG texture failed: ${key}`));
          img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sized)}`;
        }),
    ),
  );
}

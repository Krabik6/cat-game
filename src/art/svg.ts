import Phaser from 'phaser';

/** Растеризует SVG-строки в текстуры Phaser. */
export async function addSvgTextures(scene: Phaser.Scene, entries: Record<string, string>) {
  await Promise.all(
    Object.entries(entries).map(
      ([key, svg]) =>
        new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            if (scene.textures.exists(key)) scene.textures.remove(key);
            scene.textures.addImage(key, img);
            resolve();
          };
          img.onerror = () => reject(new Error(`SVG texture failed: ${key}`));
          img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
        }),
    ),
  );
}

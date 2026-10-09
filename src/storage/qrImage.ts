import jsQR from 'jsqr';

export async function readQrImage(file: File): Promise<string> {
  if (!/\.(png|jpe?g|webp|svg)$/i.test(file.name)) throw new Error('请选择 PNG、JPEG、WebP 或 SVG 图片。');
  if (file.size > 10 * 1024 * 1024) throw new Error('图片不能超过 10MB。');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (!image.naturalWidth || !image.naturalHeight) throw new Error('图片无法读取，请重新选择。');
    const scale = Math.min(1, 2048 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('无法读取图片，请更换浏览器后重试。');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    const result = jsQR(pixels.data, pixels.width, pixels.height, { inversionAttempts: 'attemptBoth' });
    if (!result) throw new Error('未识别到二维码，请上传清晰完整的二维码图片。');
    return result.data;
  } catch (error) {
    if (error instanceof Error && error.name === 'Error') throw error;
    throw new Error('图片无法读取，请重新选择。');
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function qrStoreId(value: string): string {
  let url: URL;
  try { url = new URL(value, window.location.origin); } catch { throw new Error('二维码不是有效的店铺入口。'); }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('二维码不是有效的店铺入口。');
  const match = /^\/m\/([^/]+)\/?$/.exec(url.pathname);
  if (!match?.[1]) throw new Error('请上传商家提供的店铺二维码。');
  try { return decodeURIComponent(match[1]); } catch { throw new Error('店铺编号无效。'); }
}

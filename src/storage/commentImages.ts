export function readCommentImage(file: File): Promise<string> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    return Promise.reject(new Error('请选择PNG、JPEG或WebP图片。'));
  }
  if (file.size > 1024 * 1024) return Promise.reject(new Error('每张图片不能超过1MB。'));
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('图片读取失败，请重新选择。'));
    reader.onload = () => {
      const src = reader.result;
      if (typeof src !== 'string') { reject(new Error('图片读取失败，请重新选择。')); return; }
      const image = new Image();
      image.src = src;
      image.decode().then(() => resolve(src), () => reject(new Error('图片无法打开，请重新选择。')));
    };
    reader.readAsDataURL(file);
  });
}

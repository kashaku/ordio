import { useState } from 'react';
import { ImageIcon } from 'lucide-react';

interface DishImageProps {
  src: string;
  name: string;
  variant?: 'thumbnail' | 'detail';
}

export function DishImage({ src, name, variant = 'thumbnail' }: DishImageProps) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  return (
    <div className={`flex w-full items-center justify-center overflow-hidden bg-neutral-100 text-neutral-400 ${variant === 'detail' ? 'aspect-[4/3]' : 'aspect-square rounded-lg'}`}>
      {src && failedSource !== src
        ? <img src={src} alt={name} className="h-full w-full object-cover" onError={() => setFailedSource(src)} />
        : <ImageIcon size={variant === 'detail' ? 48 : 28} aria-label={`${name}暂无图片`} />}
    </div>
  );
}

import { useRef, useState } from 'react';
import { ArrowLeft, ImageUp, ScanLine } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { readQrImage, qrStoreId } from '../storage/qrImage';
import { readOrdioData } from '../storage/ordioStorage';

export function ScanPage() {
  const navigate = useNavigate();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function upload(file: File): Promise<void> {
    setBusy(true);
    setError('');
    try {
      const storeId = qrStoreId(await readQrImage(file));
      if (!readOrdioData().stores.some((store) => store.id === storeId)) throw new Error('该店铺不存在，请确认二维码后重试。');
      navigate(`/m/${encodeURIComponent(storeId)}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '识别失败，请重新上传。');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  return <main className="mx-auto min-h-dvh max-w-[480px] bg-white text-ink shadow-sm">
    <header className="flex h-16 items-center gap-3 border-b px-5">
      <Link to="/merchant" aria-label="返回商家端" title="返回商家端" className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-neutral-100"><ArrowLeft size={20} /></Link>
      <h1 className="text-lg font-semibold">扫码点餐</h1>
    </header>
    <section className="px-6 py-12">
      <div className="flex aspect-square w-full items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50"><ScanLine size={104} strokeWidth={1} className="text-leaf" /></div>
      <input ref={input} type="file" aria-label="店铺二维码图片" accept="image/png,image/jpeg,image/webp,image/svg+xml,.svg" disabled={busy} className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} />
      <button type="button" disabled={busy} onClick={() => input.current?.click()} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-citrus font-semibold disabled:opacity-50"><ImageUp size={20} />{busy ? '识别中…' : '上传二维码'}</button>
      {busy && <p role="status" className="mt-4 text-center text-sm text-neutral-500">正在识别店铺二维码</p>}
      {error && <p role="alert" className="mt-4 break-words text-sm text-red-700">{error}</p>}
    </section>
  </main>;
}

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { ImagePlus, Send, Star, X } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { commentSchema, publishLocalComment, type CommentInput } from '../../storage/commentStorage';
import { readCommentImage } from '../../storage/commentImages';
import { DishImage } from './DishImage';

interface CommentComposerProps {
  storeId: string;
  dishId: string;
  onClose: () => void;
  onPublished: () => void;
}

const fieldClass = 'mt-2 min-h-11 w-full min-w-0 rounded-lg border bg-white px-3 py-2 text-sm focus:border-leaf focus:outline-leaf';
const commentFormSchema = commentSchema.pick({ rating: true, content: true, images: true });
type CommentFormInput = Pick<CommentInput, 'rating' | 'content' | 'images'>;

export function CommentComposer({ storeId, dishId, onClose, onPublished }: CommentComposerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const uploadLock = useRef(false);
  const submitLock = useRef(false);
  const [attemptId] = useState(() => `comment-${crypto.randomUUID()}`);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const { control, register, handleSubmit, watch, setValue, getValues, formState: { errors, isSubmitting } } = useForm<CommentFormInput>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: {
      rating: 0, content: '', images: [],
    },
  });
  const values = watch();

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.currentTarget.files ?? [])];
    event.currentTarget.value = '';
    if (!files.length || uploadLock.current) return;
    setError('');
    if (files.length + getValues('images').length > 3) { setError('最多上传3张图片。'); return; }
    uploadLock.current = true;
    setUploading(true);
    try {
      const images = await Promise.all(files.map(readCommentImage));
      setValue('images', [...getValues('images'), ...images], { shouldValidate: true });
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : '图片读取失败，请重试。');
    } finally {
      uploadLock.current = false;
      setUploading(false);
    }
  }

  const submit = handleSubmit((input) => {
    if (submitLock.current || uploadLock.current) return;
    submitLock.current = true;
    setError('');
    try {
      publishLocalComment(storeId, { ...input, commentedDishId: dishId, orderId: '', selectedDishIds: [] }, attemptId);
      onPublished();
    } catch (cause: unknown) {
      setError(cause instanceof DOMException && cause.name === 'QuotaExceededError'
        ? '存储空间不足，请移除部分图片后重试。'
        : cause instanceof Error ? cause.message : '评论未能保存，请重试。');
      submitLock.current = false;
    }
  });

  return <dialog ref={dialogRef} aria-labelledby="comment-composer-title" onCancel={onClose} className="fixed inset-0 m-auto h-fit max-h-[calc(100dvh_-_32px)] w-[calc(100%_-_32px)] max-w-[480px] overflow-y-auto rounded-lg bg-white p-0 text-ink shadow-xl backdrop:bg-black/40">
    <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-5 py-3"><h2 id="comment-composer-title" className="font-semibold">写评论</h2><button type="button" aria-label="关闭评论表单" title="关闭" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-neutral-100"><X size={20} /></button></div>
    <form onSubmit={submit} noValidate className="space-y-5 p-5 pb-[max(20px,env(safe-area-inset-bottom))]">
      <fieldset><legend className="text-sm font-medium">评分</legend><div className="mt-2 flex gap-2"><Controller name="rating" control={control} render={({ field }) => <>{[1, 2, 3, 4, 5].map((rating) => <label key={rating} className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg focus-within:ring-2 focus-within:ring-leaf"><input type="radio" name={field.name} value={rating} checked={field.value === rating} onChange={() => field.onChange(rating)} onBlur={field.onBlur} ref={rating === 1 ? field.ref : undefined} aria-label={`${rating}星`} className="sr-only" /><Star size={27} className={rating <= field.value ? 'fill-citrus text-citrus' : 'text-neutral-300'} /></label>)}</>} /></div>{errors.rating && <p role="alert" className="mt-1 text-xs text-red-700">{errors.rating.message}</p>}</fieldset>
      <label className="block text-sm font-medium">评论内容<textarea {...register('content')} aria-label="评论内容" maxLength={500} rows={4} className={`${fieldClass} resize-y`} aria-invalid={Boolean(errors.content)} aria-describedby={errors.content ? 'comment-content-error' : undefined} />{errors.content && <span id="comment-content-error" role="alert" className="mt-1 block text-xs text-red-700">{errors.content.message}</span>}</label>
      <div><div className="flex items-center justify-between"><span className="text-sm font-medium">评论图片</span><span className="text-xs text-neutral-500">{values.images.length}/3</span></div>
        <div className="mt-3 grid grid-cols-3 gap-2">{values.images.map((src, index) => <div key={`${src}-${index}`} className="relative"><DishImage src={src} name={`待发布图片${index + 1}`} /><button type="button" disabled={uploading} onClick={() => { setError(''); setValue('images', values.images.filter((_, item) => item !== index), { shouldValidate: true }); }} aria-label={`移除图片${index + 1}`} title="移除图片" className="absolute right-0 top-0 flex h-9 w-9 items-center justify-center rounded-lg bg-white/90"><X size={16} /></button></div>)}</div>
        <label className="mt-3 flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border text-sm"><ImagePlus size={18} />{uploading ? '读取图片中…' : '上传图片'}<input type="file" multiple accept="image/png,image/jpeg,image/webp" aria-label="上传评论图片" onChange={upload} disabled={uploading || values.images.length >= 3} className="sr-only" /></label>
        <p className="mt-2 text-xs text-neutral-500">最多3张，每张不超过1MB。</p>{errors.images && <p role="alert" className="mt-2 text-xs text-red-700">{errors.images.message}</p>}
      </div>
      {error && <p role="alert" className="text-sm leading-6 text-red-700">{error}</p>}
      <button type="submit" disabled={uploading || isSubmitting} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-citrus text-sm font-semibold disabled:opacity-40"><Send size={17} />{isSubmitting ? '发布中…' : '发布评论'}</button>
    </form>
  </dialog>;
}

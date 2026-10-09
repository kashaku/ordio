import { useEffect, useState } from 'react';
import { ArrowLeft, MessageSquare, PenLine, Star } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import { CommentComposer } from '../components/customer/CommentComposer';
import { CommentEntry } from '../components/customer/CommentEntry';
import { getCommentDishes } from '../storage/commentStorage';
import { readOrdioData } from '../storage/ordioStorage';

function CommentsContent({ storeId, dishId }: { storeId: string; dishId?: string }) {
  const [data, setData] = useState(readOrdioData);
  const [searchParams, setSearchParams] = useSearchParams();
  const [composerOpen, setComposerOpen] = useState(searchParams.get('write') === '1');
  const [success, setSuccess] = useState('');
  useEffect(() => {
    const refresh = () => setData(readOrdioData());
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  const store = data.stores.find((item) => item.id === storeId);
  const dishNames = getCommentDishes(data, storeId);
  const storeComments = data.comments.filter((comment) => comment.storeId === storeId);
  const comments = storeComments.filter((comment) => {
    const target = comment.commentedDishId ?? comment.dishId;
    return dishId ? target === dishId : Boolean(target);
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const knownDish = !dishId || dishNames.has(dishId) || comments.length > 0;
  const targetName = dishId ? dishNames.get(dishId) ?? comments.find((comment) => comment.dishNames?.[dishId])?.dishNames?.[dishId] ?? '已下架菜品' : store?.name;
  const average = comments.length ? (comments.reduce((sum, comment) => sum + comment.rating, 0) / comments.length).toFixed(1) : null;
  const canPublish = Boolean(store && dishId && dishNames.has(dishId));

  function closeComposer() {
    setComposerOpen(false);
    const next = new URLSearchParams(searchParams);
    next.delete('write');
    setSearchParams(next, { replace: true });
  }

  return <main className="mx-auto min-h-dvh max-w-[480px] bg-white pb-[calc(100px+env(safe-area-inset-bottom))] font-sans text-ink">
    <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-white px-3 py-2"><Link to={dishId ? `/m/${storeId}/dish/${dishId}` : `/m/${storeId}`} aria-label={dishId ? '返回菜品详情' : '返回菜单'} title="返回" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-neutral-100"><ArrowLeft size={20} /></Link><h1 className="min-w-0 flex-1 text-base font-semibold">菜品评论</h1></header>
    {!store || !knownDish ? <div className="px-5 py-16 text-center"><MessageSquare className="mx-auto mb-4 text-neutral-300" size={36} /><h2 className="text-lg font-semibold">{!store ? '店铺不存在' : '菜品不存在'}</h2><Link to={`/m/${storeId}`} className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-leaf px-5 text-sm text-white">返回菜单</Link></div> : <>
      <section className="border-b px-5 py-5"><h2 className="break-words text-xl font-semibold">{targetName}</h2><div className="mt-3 flex items-center gap-2 text-sm"><Star size={18} className="fill-citrus text-citrus" /><strong>{average ?? '暂无评分'}</strong><span className="text-xs text-neutral-500">{comments.length} 条评论</span></div></section>
      {success && <p role="status" className="border-b bg-green-50 px-5 py-3 text-sm text-leaf">{success}</p>}
      <section aria-label="评论列表" className="px-5">{comments.length > 0 ? comments.map((comment) => <CommentEntry key={comment.id} comment={comment} dishNames={dishNames} showTarget={!dishId} />) : <div className="py-16 text-center"><MessageSquare className="mx-auto mb-3 text-neutral-300" size={28} /><p className="text-sm text-neutral-500">还没有评论。</p></div>}</section>
      {dishId && <footer className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-[480px] border-t bg-white px-5 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]"><button type="button" disabled={!canPublish} onClick={() => { setSuccess(''); setComposerOpen(true); }} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-citrus text-sm font-semibold disabled:opacity-40"><PenLine size={18} />写评论</button></footer>}
      {composerOpen && canPublish && dishId && <CommentComposer storeId={storeId} dishId={dishId} onClose={closeComposer} onPublished={() => {
        setData(readOrdioData());
        setSuccess('评论已发布');
        closeComposer();
      }} />}
    </>}
  </main>;
}

export function CommentsPage() {
  const { storeId = '', dishId } = useParams();
  return <CommentsContent key={`${storeId}-${dishId ?? 'all'}`} storeId={storeId} dishId={dishId} />;
}

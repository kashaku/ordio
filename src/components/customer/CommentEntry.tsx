import { Link } from 'react-router-dom';
import { Star, UserRound } from 'lucide-react';

import type { Comment } from '../../types/domain';
import { DishImage } from './DishImage';

export function CommentEntry({ comment, dishNames, showTarget = false }: { comment: Comment; dishNames: Map<string, string>; showTarget?: boolean }) {
  const targetId = comment.commentedDishId ?? comment.dishId;
  const dishName = (id: string) => comment.dishNames?.[id] ?? dishNames.get(id) ?? '已下架菜品';
  return <article className="border-b border-neutral-100 py-5 last:border-0">
    <div className="flex items-center gap-3">
      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100 text-neutral-500">
        <UserRound size={18} />
        {comment.avatar && <img src={comment.avatar} alt={`${comment.userNickname}的头像`} className="absolute inset-0 h-full w-full object-cover" onError={(event) => { event.currentTarget.hidden = true; }} />}
      </div>
      <div className="min-w-0 flex-1"><p className="break-words text-sm font-medium">{comment.userNickname}</p><time dateTime={comment.createdAt} className="mt-1 block text-xs text-neutral-400">{new Date(comment.createdAt).toLocaleDateString('zh-CN')}</time></div>
      <span className="flex shrink-0 items-center gap-1 text-xs" aria-label={`${comment.rating}分`}><Star size={14} className="fill-citrus text-citrus" />{comment.rating.toFixed(1)}</span>
    </div>
    {showTarget && <p className="mt-3 text-xs text-leaf">{targetId ? <Link to={`/m/${comment.storeId}/comments/dish/${targetId}`}>{dishName(targetId)}的评论</Link> : '店铺评论'}</p>}
    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6">{comment.content}</p>
    {comment.images.length > 0 && <div className="mt-3 grid grid-cols-3 gap-2">{comment.images.map((src, index) => <DishImage key={`${src}-${index}`} src={src} name={`${comment.userNickname}的评论图片${index + 1}`} />)}</div>}
    {comment.selectedDishIds.length > 0 && <p className="mt-3 break-words text-xs leading-5 text-neutral-500">菜品搭配：{comment.selectedDishIds.map(dishName).join('、')}</p>}
    {comment.orderId && <p className="mt-2 text-xs text-neutral-400">已关联订单</p>}
  </article>;
}

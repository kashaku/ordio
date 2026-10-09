import { z } from 'zod';
import { localUser } from '../mock/seedData';

import { getPublishedMenu } from '../state/cartStore';
import type { Comment, OrdioData } from '../types/domain';
import { readOrdioData, writeOrdioData } from './ordioStorage';

export const commentSchema = z.object({
  userNickname: z.string().trim().min(1, '请输入昵称').max(20, '昵称最多20字'),
  rating: z.number().int().min(1, '请选择评分').max(5, '评分不能超过5星'),
  content: z.string().trim().min(1, '请输入评论内容').max(500, '评论最多500字'),
  images: z.array(z.string().max(1_400_000, '单张图片过大').regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/, '请上传PNG、JPEG或WebP图片')).max(3, '最多上传3张图片'),
  orderId: z.string(),
  commentedDishId: z.string().min(1, '请从菜品入口写评论'),
  selectedDishIds: z.array(z.string()).max(20, '最多选择20道搭配菜品'),
});

export type CommentInput = z.infer<typeof commentSchema>;

export function getCommentDishes(data: OrdioData, storeId: string): Map<string, string> {
  const dishes = new Map<string, string>();
  // Order snapshots keep purchased dishes available for review after menu changes.
  for (const order of data.orders.filter((item) => item.storeId === storeId && item.status === 'paid')) {
    for (const item of order.itemDetails ?? []) dishes.set(item.dishId, item.name);
  }
  for (const dish of getPublishedMenu(data, storeId)?.dishes ?? []) dishes.set(dish.id, dish.name);
  return dishes;
}

export function publishLocalComment(storeId: string, input: Omit<CommentInput, 'userNickname'>, id: string): Comment {
  const values = commentSchema.parse({ ...input, userNickname: localUser.nickname });
  const data = readOrdioData();
  const existing = data.comments.find((comment) => comment.id === id && comment.storeId === storeId);
  if (existing) return existing;
  if (!data.stores.some((store) => store.id === storeId)) throw new Error('店铺不存在，请重新扫码。');
  const dishes = getCommentDishes(data, storeId);
  const order = values.orderId ? data.orders.find((item) => item.id === values.orderId && item.storeId === storeId && item.status === 'paid') : undefined;
  if (values.orderId && !order) throw new Error('关联订单不可用，请重新选择已付款订单。');
  const chosenDishIds = [...new Set(values.selectedDishIds)];
  const referenced = [...chosenDishIds, ...(values.commentedDishId ? [values.commentedDishId] : [])];
  if (referenced.some((dishId) => !dishes.has(dishId) || (order && !order.items.some((item) => item.dishId === dishId)))) {
    throw new Error('所选菜品已变更或不属于关联订单，请重新选择。');
  }
  const comment: Comment = {
    id,
    storeId,
    dishId: values.commentedDishId || null,
    commentedDishId: values.commentedDishId || null,
    orderId: values.orderId || null,
    userNickname: values.userNickname,
    avatar: '',
    rating: values.rating,
    content: values.content,
    images: values.images,
    selectedDishIds: chosenDishIds,
    dishNames: Object.fromEntries(referenced.map((dishId) => [dishId, dishes.get(dishId) ?? '菜品'])),
    createdAt: new Date().toISOString(),
  };
  writeOrdioData({ ...data, comments: [...data.comments, comment] });
  return comment;
}

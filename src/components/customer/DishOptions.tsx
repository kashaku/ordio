import type { Dish, SelectedSpec } from '../../types/domain';

interface DishOptionsProps {
  dish: Dish;
  value: SelectedSpec[];
  onChange: (value: SelectedSpec[]) => void;
}

export function DishOptions({ dish, value, onChange }: DishOptionsProps) {
  return <>{dish.specs.map((group) => (
    <fieldset key={group.id} className="mb-5 min-w-0">
      <legend className="mb-2 break-words text-sm font-medium">{group.name} {group.required ? '（必选）' : '（可选）'}</legend>
      <div className="flex flex-wrap gap-2">
        {!group.required && <label className="flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm">
          <input type="radio" name={`spec-${dish.id}-${group.id}`} checked={!value.some((spec) => spec.groupId === group.id)}
            onChange={() => onChange(value.filter((spec) => spec.groupId !== group.id))} />不选
        </label>}
        {group.options.map((option) => <label key={option.id} className="flex min-h-11 max-w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm has-[:checked]:border-leaf has-[:checked]:bg-green-50">
          <input type="radio" className="shrink-0" name={`spec-${dish.id}-${group.id}`} checked={value.some((spec) => spec.groupId === group.id && spec.optionId === option.id)}
            onChange={() => onChange([...value.filter((spec) => spec.groupId !== group.id), { groupId: group.id, optionId: option.id }])} />
          <span className="min-w-0 break-words">{option.name}{option.priceDelta !== 0 && ` ${option.priceDelta > 0 ? '+' : '-'}¥${Math.abs(option.priceDelta).toFixed(2).replace(/\.00$/, '')}`}</span>
        </label>)}
      </div>
      {group.options.length === 0 && <p className="text-xs text-neutral-500">暂无可选规格</p>}
    </fieldset>
  ))}</>;
}

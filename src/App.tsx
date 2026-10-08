import { ArrowRight, QrCode, Smartphone, Store } from 'lucide-react';

const nextSteps = [
  '定义点单应用核心类型',
  '准备本地 mock 店铺与菜单数据',
  '实现商家端静态流程页',
] as const;

export function App() {
  return (
    <main className="min-h-screen bg-rice text-ink">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-md border border-ink/10 bg-porcelain px-3 py-2 text-sm shadow-sm">
              <Store className="h-4 w-4 text-leaf" />
              本地点单演示工程骨架
            </div>

            <div className="space-y-5">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-normal text-ink sm:text-5xl">
                Ordio 已准备好承载商家端和顾客端演示。
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-ink/70">
                当前版本只包含 Vite、React、TypeScript strict 和 Tailwind 的最小工程入口。
                下一步会进入本地点单数据模型与 mock 数据。
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {nextSteps.map((step, index) => (
                <div key={step} className="rounded-lg border border-ink/10 bg-porcelain p-4 shadow-sm">
                  <span className="text-sm font-medium text-leaf">0{index + 1}</span>
                  <p className="mt-3 text-sm leading-6 text-ink/75">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-[28px] border border-ink/10 bg-ink p-3 shadow-2xl">
            <div className="rounded-[22px] bg-porcelain p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">手机预览位</p>
                  <p className="text-xs text-ink/50">375px 优先适配</p>
                </div>
                <Smartphone className="h-5 w-5 text-leaf" />
              </div>

              <div className="space-y-4 rounded-xl bg-rice p-4">
                <div className="h-24 rounded-lg bg-gradient-to-br from-citrus/70 to-leaf/70" />
                <div className="space-y-2">
                  <div className="h-3 w-2/3 rounded bg-ink/80" />
                  <div className="h-3 w-full rounded bg-ink/15" />
                  <div className="h-3 w-5/6 rounded bg-ink/15" />
                </div>
                <button className="flex w-full items-center justify-center gap-2 rounded-md bg-citrus px-4 py-3 text-sm font-semibold text-ink">
                  继续搭建
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-lg border border-dashed border-ink/20 p-3 text-sm text-ink/60">
                <QrCode className="h-5 w-5 text-ink/50" />
                二维码发布将在后续任务实现
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

# 开发说明

核对日期：2026-10-16。运行和演示步骤统一见 [README](../README.md)，本文件说明当前源码和数据流。

## 实际目录

```text
src/
  pages/index/             顾客首页
  pages/customer/          扫码、主页、菜单、结算、订单
  pages/merchant/          迁移期本地商家页，仍打包
  components/             菜品卡、规格弹层、购物车
  services/               本地 repository、云客户端、入口和订单逻辑
  stores/                 Pinia 购物车状态
  data/                   本地种子和主页模板
  utils/                  参数解析、金额、ID、图片和令牌
  cloudfunctions/ordioApi/ 云函数源码，独立 package.json 和锁文件
  manifest.json           AppID、基础库、cloudfunctionRoot 等构建配置
  pages.json              小程序路由
apps/merchant-admin/      独立 Vue Web 管理端，使用根依赖
cloudbase/indexes/        云数据库索引定义
cloudbase/seeds/          指定开发环境的查询和更新文件
scripts/                 本机工具脚本
tests/                   Node 测试
docs/                    按用途拆分的说明
dev-log.md               唯一开发日志
```

根 `package.json` 管理两个前端。云函数使用自己的依赖清单，部署以 `src/cloudfunctions/ordioApi` 为源。`vite.config.js` 会把云函数复制到微信构建产物；复制不等于部署。

`dist/`、`node_modules/` 是忽略提交的生成目录。`dist/dev/mp-weixin` 与 `dist/build/mp-weixin` 分别由开发、正式构建生成，`dist/merchant-admin` 为 Web 构建产物。不要把它们当成三套源码，也不要手工修改其中的业务文件。

仓库没有 `weapp/`、原生 `miniprogram/` 或 `apps/customer-mini/` 源码目录。未来拆分目录需单独迁移；文档不再把规划目录当成当前结构。

## 当前数据流

| 功能 | 调用位置 | 当前数据源 |
| --- | --- | --- |
| 微信身份 | `App.vue → session-service → cloud-client` | 已配置时调用 `session.get`；未配置时跳过 |
| 扫码令牌解析 | `scan.vue → entry-service` | 已配置时调用 `entry.resolveTable`，否则本地 `resolveTableToken` |
| 顾客主页 | `storefront.vue → repository` | 本地门店、主页发布副本、菜单；桌台也重新从本地读取 |
| 菜单与结算 | `menu.vue / checkout.vue → repository / order-service` | 本地菜单、桌台、购物车和重新计价 |
| 订单与付款 | `order-service / order-detail.vue → repository` | 本地创建订单；`payOrder` 只更新缓存状态 |
| 旧小程序商家页 | `pages/merchant/index.vue → repository` | 本机草稿、发布副本、桌台；不修改云端 |
| 商家 Web | `apps/merchant-admin/src/services` | 未配置 API 时使用浏览器预览会话和草稿；配置后请求尚待实现的 HTTP 服务 |

`repository.js` 默认绑定 `localRepository`，目前没有云端 repository 实现。配置云环境不会自动替换它。扫码入口通过云端校验后，后续主页和结算仍依赖本地桌台；新增或轮换云端令牌可能在后续页面失败。本地 A01 与云端种子一致时能演示，这不是完整云端订单链路。

小程序中的 `getPublishedStorefront` 是本地 repository 方法；云函数动作 `storefront.getPublished` 是另一条尚未接入顾客页面的接口。两者不能混称为“顾客已经读取云端发布版”。

商家 Web 的 `localStorage` 与小程序的 `uni` 缓存完全独立，Web 保存草稿不会修改顾客所见内容。主页模板默认值目前在小程序和 Web 各维护一份；后续接入正式发布时统一契约并验证迁移，不在目录整理时擅改存量草稿。

## 页面与入口

`src/pages.json` 注册 8 个页面：

| 路径 | 用途 | 主要参数 |
| --- | --- | --- |
| `pages/index/index` | 默认顾客首页 | 无；不处理桌台启动参数 |
| `pages/customer/scan` | 解析入口并跳转主页 | `tableToken` 或 `scene`；兼容 `storeId` |
| `pages/customer/storefront` | 门店主页 | `storeId`、可选 `tableToken` |
| `pages/customer/menu` | 菜单 | 同上 |
| `pages/customer/checkout` | 结算 | 同上，无有效桌台不能提交 |
| `pages/customer/order-detail` | 本地订单详情 | `orderId` |
| `pages/customer/orders` | 本地订单列表 | `storeId` |
| `pages/merchant/index` | 本地商家编辑参照 | 内部固定 `store-demo` |

演示入口应从扫码页带参数进入，不能把参数填在默认首页后期待它自动解析。Web 路由是 `/login`、`/`、`/storefront`，与小程序页面路径无关。

## 本地数据规则

缓存前缀为 `ordio:mvp:`，后缀为 `version`、`stores`、`tables`、`draft-menus`、`published-menus`、`draft-storefronts`、`published-storefronts`、`carts`、`orders`。初始化和版本迁移在 `local-repository.js`；旧版本补数据的行为以代码分支为准，不承诺所有未知版本都无损迁移。

- 门店资料单独保存，本机顾客页再次读取时生效。
- 菜单与主页各自保存草稿，发布时深拷贝为当前发布副本。本地实现不保留完整发布历史。
- 金额使用整数分；购物车保存菜品 ID、规格和数量；客户端结算重新校验菜单并保存订单商品快照。
- 本地订单包含桌台 ID 和桌号，当前没有区域快照；订单列表只按门店过滤，没有服务端“仅本人订单”授权。
- 图片保存在本机持久文件，尚未接云存储。
- 重置开发数据会覆盖本机业务缓存；排障时不要先清空用户数据。

## 构建与依赖

使用 uni-app CLI、Vue 3、Vite 和 Pinia。2026-10-16 本机 Node `22.17.0`、npm `10.9.2`；微信基础库在 `manifest.json` 固定为 `3.17.2`。

根脚本只保留微信小程序、商家 Web 和已有测试入口。模板自带的其他平台依赖仍留在锁文件中，本次未拆改 DCloud 依赖组；保留依赖不代表项目支持并验收了其他平台。

- 不单独升级 Vue、Vite 或某一个 `@dcloudio/*` 包；当前 Pinia 固定为 `2.1.7`。
- 不为整理目录添加根 `type: module`，当前 uni-app 配置依赖既有模块模式。
- Vue 页面类型扩展统一放在根 `shims-uni.d.ts`。
- `.env.local` 更改后重启编译；`VITE_*` 可进入客户端包，不放密钥。
- `manifest.json` 中的 `urlCheck: false` 是开发设置，正式发布前需要核对域名与发布配置。

验证范围和当次结果记录在[开发日志](../dev-log.md)。历史构建警告、依赖审计数字只表示记录当时的结果，不当成当前已修复或当前审计结论。

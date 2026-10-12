# CloudBase 开发接入

当前已将 `ordioApi` 部署到开发环境 `cloud1-d4gl08nvu64e07107`，并完成小程序端身份客户端接入。未设置 `VITE_CLOUDBASE_ENV` 时，应用继续使用本地 repository，现有点餐流程不受影响。

已创建 `users`、`store_members`、`stores`、`tables` 集合及首批索引。当前机器通过不入库的 `.env.local` 绑定开发环境；仓库只保留 `.env.example`。

## 当前接口

| action | 用途 | 身份要求 |
| --- | --- | --- |
| `session.get` | 建立用户记录并读取门店成员关系 | 微信 OpenID |
| `entry.resolveTable` | 服务端解析桌台令牌 | 无商家角色要求 |
| `merchant.listTables` | 读取指定门店桌台 | `owner` 或 `manager` |
| `storefront.getDraft` | 读取门店主页草稿 | `owner` 或 `manager` |
| `storefront.saveDraft` | 按修订号保存主页草稿 | `owner` 或 `manager` |
| `storefront.publish` | 生成不可变主页发布版本 | `owner` 或 `manager` |
| `storefront.getPublished` | 读取门店最新发布主页 | 顾客可读 |

后四个主页接口当前已在本地代码中实现，尚未部署到开发环境。

云函数统一返回：

```json
{
  "ok": true,
  "data": {},
  "requestId": "req_xxx"
}
```

失败时 `ok` 为 `false`，并返回 `error.code`、`error.message` 和同一个 `requestId`。

## 环境配置

1. 在微信开发者工具中为 AppID `wx3a13cbb8859858e6` 选择开发环境 `cloud1-d4gl08nvu64e07107`。
2. 复制 `.env.example` 为 `.env.local`，填写真实环境 ID：

```text
VITE_CLOUDBASE_ENV=真实环境ID
VITE_CLOUDBASE_FUNCTION=ordioApi
```

3. 重新执行 `npm run dev:mp-weixin`。构建产物的 `project.config.json` 会包含 `cloudfunctionRoot`，云函数会复制到 `dist/dev/mp-weixin/cloudfunctions`。

环境 ID 不是 AppID，不能互相替代。`.env.local` 不提交到仓库，生产环境也不能复用当前开发环境数据。

## 首批集合

当前云函数需要以下集合：

### `users`

```text
_id
openid          string, unique
status          active | disabled
created_at      date
updated_at      date
```

### `store_members`

```text
_id
store_id        stores._id
user_id         users._id
role            owner | manager | cashier | kitchen
status          active | disabled
created_at      date
updated_at      date
```

需要 `(store_id, user_id)` 唯一约束，并为 `user_id + status` 建查询索引。

### `stores`

```text
_id
name            string
status          active | paused | disabled
owner_user_id   users._id
address         string
business_hours  string
created_at      date
updated_at      date
```

### `tables`

```text
_id
store_id        stores._id
name            string
area            string
table_token     string, unique
enabled         boolean
qr_file_id      string
created_at      date
updated_at      date
```

为 `table_token` 建唯一索引，为 `store_id + enabled` 建查询索引。集合默认不开放客户端写权限，核心读写统一经过云函数。

### `storefront_drafts`

```text
_id
store_id            stores._id, unique
config              经过白名单校验的主页配置
revision            乐观并发修订号
published_version   最近发布版本
created_by / updated_by
created_at / updated_at
```

### `storefront_releases`

```text
_id
store_id            stores._id
version             门店内递增版本
status              published
config              不可变发布快照
source_revision     来源草稿修订号
published_by / published_at
```

需要 `(store_id, version)` 唯一索引，以及 `store_id + status + version` 最新版本查询索引。这两个集合和索引尚待创建。

## 部署顺序

1. 确认唯一目标环境 ID。
2. 创建集合和索引。
3. 部署 `src/cloudfunctions/ordioApi`，选择云端安装依赖。
4. 写入一个测试门店、成员和桌台。
5. 配置 `.env.local`，重新构建并验证 `session.get`。
6. 调用 `entry.resolveTable` 验证有效、停用和失效令牌。

本阶段只接通身份和桌码解析。门店主页、菜单、下单和支付仍使用本地实现；在完整云端 repository 和服务端订单接口完成前，不切换业务数据源。

## 当前部署状态

- `ordioApi`：已部署，运行时 `Nodejs16.13`，状态 `Active`。
- 集合：`users`、`store_members`、`stores`、`tables` 已创建。
- 索引：用户 OpenID、门店成员关系、桌台令牌等索引已创建并核对。
- `session.get`：已在微信模拟器显式调用成功，真实用户记录已创建。
- 试点数据：`禾间小馆`、店主成员关系、A01 和 A02 已写入并读取核对。
- `entry.resolveTable`：有效 A01 令牌和不存在令牌均已通过云函数与完整页面流程验证；桌台停用分支尚待临时写入测试。
- 顾客入口：配置 CloudBase 时已经切换为服务端桌码解析，未配置环境时才使用本地适配器。
- 待部署：主页草稿/发布接口、`storefront_drafts`、`storefront_releases` 及其索引。
- 云函数依赖审计：`wx-server-sdk@4.0.2` 的传递依赖仍有 1 个 moderate、5 个 high；强制修复会降级主依赖，本阶段不执行。

开发种子文件位于 `cloudbase/seeds`。这些文件只用于当前开发环境，写入前仍需核对目标 AppID 和环境 ID；生产环境不得直接复用开发成员身份或桌台令牌。

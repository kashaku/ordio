# CloudBase 开发接入

本文件是云环境与部署状态的记录入口。最近一次只读核对：2026-10-16；后续操作前仍应读取实时状态。

## 环境

| 项目 | 值 |
| --- | --- |
| AppID | `wx3a13cbb8859858e6` |
| 开发环境 | `cloud1-d4gl08nvu64e07107` |
| 云函数 | `ordioApi` |
| 部署源码目录 | `src/cloudfunctions/ordioApi` |
| 当前函数状态 | `Active`，运行时 `Nodejs16.13`，超时 3 秒 |

当前操作范围仅开发环境。没有完成生产环境、真实支付或正式商家网页登录配置。不要使用或保存旧对话中暴露过的 CLI 密钥。

根目录 `.env.example` 为配置模板。需要云端联调时在不入库的 `.env.local` 中设置：

```dotenv
VITE_CLOUDBASE_ENV=cloud1-d4gl08nvu64e07107
VITE_CLOUDBASE_FUNCTION=ordioApi
```

不启用云端时让 `VITE_CLOUDBASE_ENV` 留空，重启开发编译。当前配置只影响微信身份初始化和扫码入口；主页、菜单、结算、订单仍使用本地 repository。环境 ID 与 AppID 不可互换。

`VITE_MERCHANT_API_BASE` 是独立 Web 管理端的 HTTP 服务地址约定，当前服务尚未实现。它不是环境 ID，也不能直接填写云函数名。具体响应结构见两个 Web service 文件；没有实际服务前保留为空。

## 实时资源核对

| 集合 | 文档数 | 状态 |
| --- | --- | --- |
| `users` | 1 | 已存在 |
| `store_members` | 1 | 已存在 |
| `stores` | 1 | 已存在 |
| `tables` | 2 | 已存在；A01、A02 均为启用，`qr_file_id` 为空 |
| `storefront_drafts` | 0 | 已存在；`store_unique` 唯一索引已确认 |
| `storefront_releases` | 0 | 已存在；只有默认索引，缺两个业务索引 |

草稿索引与 `cloudbase/indexes/storefront-drafts.json` 一致：`store_id` 升序、唯一、非稀疏。

发布集合尚缺 `cloudbase/indexes/storefront-releases.json` 定义的：

- `store_version_unique`：`store_id ASC + version DESC`，唯一。
- `store_status_version`：`store_id ASC + status ASC + version DESC`，非唯一。

其他四个集合的业务索引曾于 2026-10-09 核对，本轮只核对集合存在和主页索引，没有重新逐项验证全部旧索引。数据库安全规则也没有在本轮读取；“核心集合禁止客户端直接写入”是要求，不应据此声称实时权限已审计通过。

2026-10-12 的草稿索引确认任务 `confirmation_cloud_db_write_struct_75d78b42-da5f-4e5c-8c63-d57257d674da` 在本轮查询返回 `Task not found`。随后直接读回发现索引已经存在，因此不要重发该创建操作。两个主页集合都已创建，也不要重复创建。

只读核对请求 ID：

| 核对项 | requestId |
| --- | --- |
| 全部集合 | `db416dde-a1fb-4f32-b59f-51e414e5242d` |
| 草稿索引 | `000851f6-ab87-4c3d-ab85-b00c00a00850` |
| 发布索引 | `46e2257a-b723-4154-89e5-6bf2893a52aa` |
| A01 | `34216c58-f890-42fa-b278-9e8414c7d744` |
| A02 | `e79a3f05-0282-48d7-ac5a-a1c8a622691d` |

## 源码接口与上线证据

| action | 实现与身份要求 | 验证边界 |
| --- | --- | --- |
| `session.get` | 根据微信 OpenID 建立用户并读取成员关系 | 之前已联调 owner 身份 |
| `entry.resolveTable` | 校验令牌、桌台启用、门店 active | A01 有效入口已在模拟器验证；无效令牌历史验证通过；停用分支仍待联调 |
| `merchant.listTables` | `owner/manager` | 之前已联调两张桌台 |
| `storefront.getDraft` | `owner/manager` | 本地代码已实现，云端本轮未确认 |
| `storefront.saveDraft` | `owner/manager`，白名单与修订号检查 | 本地代码已实现，尚无云端草稿 |
| `storefront.publish` | `owner/manager`，创建发布记录 | 本地代码已实现，尚无云端发布记录 |
| `storefront.getPublished` | 顾客可读，要求门店 active 和已发布版本 | 本地代码已实现，顾客页面尚未调用 |

最后有明确部署记录的版本是身份和桌码版本。本轮 `cloud_fn_info` 只证明函数 Active，不提供代码版本证据；尝试通过模拟器只读调用主页接口未获得可核对的 JSON 响应，因此不把该调用记为成功，也不把本地新增接口记成已部署。下一步仍需完成新版部署、动作联调和数据读回。

随后模拟器诊断返回 `APPID_ERROR`，原始信息为 `connect ETIMEDOUT 198.18.0.13:443`。已核对开发/构建配置中的 AppID 正确；这是本轮远端校验请求超时的证据，不据此更换 AppID 或重建项目。网络恢复后再完成主页动作和页面复验。

云函数返回 `{ ok: true, data, requestId }`，业务失败返回 `{ ok: false, error: { code, message }, requestId }`。`requestId` 目前用于追踪日志，没有幂等去重功能。

## 集合字段与代码边界

| 集合 | 主要字段 |
| --- | --- |
| `users` | `openid`、`status`、创建/更新时间 |
| `store_members` | `store_id`、`user_id`、`role`、`status` |
| `stores` | `name`、`status`、`owner_user_id`、`address`、`business_hours` |
| `tables` | `store_id`、`name`、`area`、`table_token`、`enabled`、`qr_file_id` |
| `storefront_drafts` | `store_id`、`config`、`revision`、`published_version`、编辑人/时间 |
| `storefront_releases` | `store_id`、`version`、`status`、`config`、`source_revision`、发布人/时间 |

实际实现使用 CloudBase 文档型数据库（NoSQL）。仓库没有 MySQL 连接、SQL 迁移或 ORM，历史 MySQL 内容属于方案评估。

主页白名单校验覆盖模板、颜色、文案长度、区块类型/数量和招牌菜 ID 格式/数量。目前不校验菜品是否真实存在并属于本门店，首轮云端配置的 `featuredDishIds` 应为空。

修订号检查目前是先读后写，没有原子条件更新或事务；发布新增记录和回写草稿也是分步执行。顺序调用时的冲突提示不能证明并发安全。并发保存、重复发布和部分失败恢复都需补验证与实现。

## 后续部署与联调

继续执行前读取[交接清单](next-session-handoff.md)。当前应补发布集合索引，而不是重建所有集合。部署目录固定为源码目录，使用云端安装依赖。函数 Active 后还要调用动作、核对响应和数据库内容。

`cloudbase/seeds` 中的 query/update 文件仅用于指定开发数据；更新文件含多字段 `$set`，不能把它们当成无条件重置脚本。临时停用 A02 时只更新 `enabled`，验证后必须恢复为 `true` 并读回。本轮仅查询 A02，未临时停用。

任何异步写入返回 taskId 后记录原任务并查询原任务，不重复提交。旧任务查不到时先核对目标资源；状态仍无法确定则不重发有副作用的动作。

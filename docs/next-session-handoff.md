# 开发交接

更新时间：2026-10-16。启动和演示步骤见 [README](../README.md)，云资源事实只在 [CloudBase 文档](cloudbase-development.md) 维护。本文件保留下一步和恢复操作所需信息。

## 工作区基线

本轮开始时分支 `rebuild/uniapp-mvp`，HEAD `8e1c5a9`；`dev-log.md` 已有未提交交接记录，本文件已存在但未跟踪。它们已保留并继续更新，不能称工作区干净。

本地已有的上游跟踪引用比 HEAD 多提交 `274e0a92`，内容为根 `project.config.json` 和忽略规则。本轮未 fetch、未合并；该根配置没有 `miniprogramRoot`。后续处理此提交时需核对导入方式，避免根配置把 uni-app 源码目录当成小程序产物。当前 README 统一使用 `dist/dev/mp-weixin`。

仓库原来没有 `AGENTS.md`，本轮补入维护约束。继续工作先看 Git 状态与差异，不覆盖已有修改，不直接修改 dist。

## 当前阻断点

- 顾客页面可通过 A01 编译参数演示，无需新入口或桌码图片；主页内容仍为本地发布副本。
- 两个主页集合及草稿唯一索引已存在，发布集合业务索引还缺；两集合均无文档。
- `ordioApi` Active 不代表本地新动作已经部署；主页接口尚缺可核对的云端联调结果。
- A02 本轮读回为 `enabled=true`；临时停用验证尚未完成。
- Web 开发预览草稿与小程序本地发布副本不互通；正式商家登录和 HTTP 服务仍缺失。
- 本轮文档整理后的模拟器复验受阻：工具返回 `APPID_ERROR` / `connect ETIMEDOUT 198.18.0.13:443`，产物 AppID 已核对正确。当天较早的 A01 页面与截图验证成功；不要把较早结果记成本轮重编译后的复验成功。

## 下一批操作顺序

1. 核对 AppID、开发环境、实时集合/索引/草稿/发布记录。目标范围沿用 CloudBase 文档。
2. 只创建发布集合缺失的两个索引并读回；不要重建已有集合或草稿索引。
3. 完整部署 `src/cloudfunctions/ordioApi`，云端安装依赖；读回 Active，再验证动作响应。
4. 读取 `storefront.getDraft`。只有确认为空时，使用 `storeId=store-demo`、`revision=0` 保存首份配置；`featuredDishIds=[]`。若已有草稿或发布版，先比对内容和 revision，避免重复发布。
5. 再读草稿，确认 revision；用旧 revision 保存应返回 `DRAFT_CONFLICT`。用当前 revision 发布一次，再读 `storefront.getPublished` 与数据库，核对版本、门店、配置和来源修订。
6. 临时仅将 A02 `enabled` 设为 false，验证 `TABLE_DISABLED`；无论成功或失败均恢复 true 并读回。恢复优先于其他开发工作。
7. 接入顾客主页发布版读取，保留未配置环境的本地后备。验证有效发布、未发布门店、网络失败，且顾客不读草稿。
8. 运行 README 中的验收命令，验证模拟器页面；更新云状态、交接与根开发日志。

修订检查目前先读后写；并发保存和发布幂等尚未实现，验收不得扩张为“并发安全”。后续范围见[路线图](production-roadmap.md)。

## 异步任务恢复

旧草稿索引任务：`confirmation_cloud_db_write_struct_75d78b42-da5f-4e5c-8c63-d57257d674da`。2026-10-16 查询返回 `Task not found`，但实时 `store_unique` 已存在且定义一致；本轮未重发。

后续任务返回 taskId 后记录原操作、目标和最后状态，继续查原任务。任务状态未知时先读资源核实，不能直接重交可能重复写入的操作。此文档不保存令牌。

## 授权与未决项

当前会话已明确授权的开发环境批次：创建主页集合及索引、部署新版函数、写入并发布首份试点主页、临时停用并恢复 A02；已完成部分不要重复执行。本轮整理仅做云端只读核对，没有新增云写入。此记录不扩展为生产、支付、删除集合/文档或批量覆盖授权。

正式商家 Web 登录仍需官方资料及实际账号、域名条件验证。现有 `/merchant/session`、`/merchant/login`、`/merchant/logout` 和主页 draft/publish 路由是前端约定，没有对应已实现 HTTP 服务，不得伪造接通结果。

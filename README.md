# Ordio

uni-app / Vue 3 顾客小程序和独立 Vue 商家 Web 管理端。目前可演示门店主页、菜单、规格、购物车和本地订单；微信身份、扫码入口的桌台解析已接 CloudBase。主页内容、菜单和订单仍在小程序本地缓存，支付是本地状态模拟。

## 在开发者工具里演示顾客流程

在仓库根目录执行，当前机器为 `D:\vsCode\ordio`：

```powershell
npm ci
npm run dev:mp-weixin
```

`npm ci` 用于首次安装或锁文件变化后重装依赖。等待开发编译完成，保持这个终端运行，它会监听源码变化。

微信开发者工具只需导入这一个目录：

```text
D:\vsCode\ordio\dist\dev\mp-weixin
```

AppID 为 `wx3a13cbb8859858e6`。不要把仓库根目录、`src` 或 `dist` 本身作为小程序目录。修改代码应编辑 `src/`，开发者工具读取编译产物。

普通编译默认进入首页，首页只有“扫码进入门店”。没有桌牌时，用开发者工具的编译模式携带桌台参数即可打开现有顾客页面：

1. 点击开发者工具顶部“普通编译”旁的下拉菜单，添加自定义编译模式（不同工具版本的菜单名称可能略有不同）。
2. 模式名称填写 `A01 顾客流程`。
3. 启动页面填写 `pages/customer/scan`。
4. 启动参数填写下列内容，不带开头的 `?`：

```text
tableToken=tbl_7eJr2pkN4xQm9VaL6sTyBwUc
```

5. 保存、选择该模式并编译。扫码页会解析令牌，自动进入“禾间小馆”的门店主页，显示“大厅 · A01桌”。点击“开始点餐”即可继续选择菜品、规格和结算。

这些字段属于开发者工具的编译设置，顾客页面里没有参数输入框。无需新增按钮，也不需要二维码。2026-10-16 已在模拟器验证上述入口；A01 云端令牌仍启用。若此前在旧商家页更新过本地 A01 令牌，本地与云端可能不一致，见[入口说明](docs/entry-routing-and-storefront-plan.md)。

本机已配置 `wechatide` 时，也可以在第二个 PowerShell 终端执行已验证的工具命令：

```powershell
& 'D:\微信web开发者工具\wechatide.cmd' -c Codex open_project_window --project 'D:\vsCode\ordio\dist\dev\mp-weixin' --window-mode fullMode
& 'D:\微信web开发者工具\wechatide.cmd' -c Codex simulator_open_page --project 'D:\vsCode\ordio\dist\dev\mp-weixin' --page 'pages/customer/scan' --query 'tableToken=tbl_7eJr2pkN4xQm9VaL6sTyBwUc'
```

上面使用本机安装路径和已授权客户端名；其他机器按实际安装和授权配置使用。工具不可用时按前面的手动编译步骤操作即可。

## dev 和 build 的区别

| 命令 | 输出目录 | 用途 |
| --- | --- | --- |
| `npm run dev:mp-weixin` | `dist/dev/mp-weixin` | 开发、演示，监听源码变化；日常导入此目录 |
| `npm run build:mp-weixin` | `dist/build/mp-weixin` | 一次性正式构建，用于检查待交付的小程序产物 |
| `npm run build:merchant` | `dist/merchant-admin` | 商家 Web 静态文件，不能作为小程序导入 |

`dev` 和 `build` 同时存在正常，它们是同一份源码的两份构建输出。运行 `build:mp-weixin` 不会更新已导入的 `dist/dev/mp-weixin`；开发命令也不会更新 `dist/build/mp-weixin`。只有专门验收正式构建产物时才切换导入 `dist/build/mp-weixin`。构建不会自动上传代码、发布小程序或部署云函数。

`npm run devtools:open` 是可选的 Windows 打开窗口脚本：固定打开开发产物，使用传统 `cli.bat`，需要开发者工具开启服务端口。它不会自动设置 A01 参数。

## 预览码和桌台小程序码

| 类型 | 当前用途与状态 |
| --- | --- |
| 开发者工具预览码 | 将当前开发包发到手机预览；历史真机预览已通过。它不等于已经为 A01 生成了可长期使用的桌牌 |
| 桌台小程序码 | 目标是从微信进入指定小程序、指定页面和桌台。仓库尚未实现生成、存储和打印这套流程，云端 A01/A02 的 `qr_file_id` 为空 |
| 普通文本二维码 | 编码 `t=<tableToken>` 后，可由已经打开的小程序内扫码功能解析；不等同于能从微信直接打开本小程序的桌台小程序码。当前未提供生成工具或完成相机实测 |

模拟器演示用上面的编译模式即可。手机预览是否携带了桌台启动参数，需要另行核对；预览后停在扫码首页并不能说明已生成桌码。正式桌码的接口、账号条件和参数限制留待接入时查证。

## 商家端怎么运行

在第二个终端、同一仓库根目录执行：

```powershell
npm run dev:merchant
```

访问终端实际输出的地址，默认是 `http://127.0.0.1:5174`，进入开发预览，再进入“主页搭建”。可以编辑模板、品牌色、首屏文案和区块，查看手机预览、保存浏览器草稿。

这份浏览器草稿不会同步到小程序。未配置正式商家 API 时，“发布给顾客”不可用。生产构建没有开发预览登录入口。正式网页登录、Cookie 会话和 HTTP 服务尚未实现；仅填写 `VITE_MERCHANT_API_BASE` 不会自动获得这些能力。

原 `pages/merchant/index` 仍在小程序构建中，保留本地菜单、桌台和主页编辑，用于迁移期核对。它没有正式商家权限门禁，不能作为正式运营入口。Web 管理端补齐相关功能前暂不删除。

## 配置和验证

根目录 `.env.example` 是配置模板；`.env.local` 不提交。未配置 `VITE_CLOUDBASE_ENV` 时使用本地流程；配置后微信身份和扫码入口调用云端，其他业务不会自动切换。更改环境变量后需要重启开发编译。云环境和索引状态只在 [CloudBase 文档](docs/cloudbase-development.md) 中维护。

当前验收命令：

```powershell
npm run check:cloudfunctions
npm run test:cloudfunctions
npm run build:mp-weixin
npm run build:merchant
git diff --check
```

测试目前只覆盖主页配置校验，不能代表云端发布、并发、商家登录或支付已通过。

## 项目文档

- [开发说明](docs/uniapp-mvp-development.md)：实际目录、调用链、缓存与构建约束。
- [入口和桌码](docs/entry-routing-and-storefront-plan.md)：参数契约、当前限制及目标流程。
- [CloudBase](docs/cloudbase-development.md)：开发环境、接口、实时核对记录。
- [路线图](docs/production-roadmap.md)：尚未实现的功能和验收条件。
- [交接](docs/next-session-handoff.md)：下一步及操作恢复信息。
- [开发日志](dev-log.md)：按日期保留历史变更与验证范围。

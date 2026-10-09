# Ordio 小程序

Ordio 是一个使用 uni-app、Vue 3 和 Pinia 实现的扫码点餐与门店主页搭建 MVP。顾客启动入口已经独立，商家工作台暂时仍保留在同一个开发包内，数据保存在当前设备缓存中。

## 运行

已验证环境：Node.js 22、npm 10、微信开发者工具 `2.02.2608080`，基础库 `3.17.2`。

```powershell
npm ci
npm run dev:mp-weixin
```

微信开发者工具导入：

```text
D:\vsCode\ordio\dist\dev\mp-weixin
```

也可以在开发构建生成后执行：

```powershell
npm run devtools:open
```

这个脚本优先读取 `WECHAT_DEVTOOLS_CLI`，否则查找本机常见安装目录。使用传统 `cli.bat` 时，需要先在微信开发者工具的“设置 → 安全”中开启服务端口。

正式构建：

```powershell
npm run build:mp-weixin
```

## 当前范围

- 商家编辑店铺、分类、菜品和规格并发布菜单
- 商家从三套模板配置品牌色、首屏文案、主页区块和招牌菜并独立发布
- 商家维护桌台令牌、启停桌台和更新旧桌码
- 顾客扫描桌码进入对应门店和桌台，再进入菜单
- 规格选择、购物车、结算和订单
- 本地付款状态和历史订单
- 本地图片与业务数据持久化

商家资料单独保存并立即对顾客端生效；主页和菜单各自维护草稿与发布副本，未发布内容不会影响顾客端。

当前只完成桌码令牌和入口解析，还不能生成可打印的正式微信小程序码。不包含后端、跨设备同步、微信登录和真实支付。

CloudBase 身份和桌码解析骨架已经加入代码，但默认未启用，也尚未部署。环境配置和首批集合见 [docs/cloudbase-development.md](docs/cloudbase-development.md)。

当前实现和验收见 [docs/uniapp-mvp-development.md](docs/uniapp-mvp-development.md)。真实运营版的系统拆分、数据库、权限、支付、UI 和分期计划见 [docs/production-roadmap.md](docs/production-roadmap.md)。

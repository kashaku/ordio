# 开发记录

## 2026-10-09

- 在 orphan 分支 `rebuild/uniapp-mvp` 清除旧 React/Vite 和原生小程序试验代码。
- 使用官方 `dcloudio/uni-preset-vue` 的 `vite` 模板重建根目录工程，模板提交为 `053c9794519215d7f5a38beb1252e11efc7820d5`。
- 使用 Vue 3、JavaScript、Pinia 和本地缓存实现商家发布、顾客点餐、购物车、订单及模拟付款。
- 微信 AppID 沿用 `wx3a13cbb8859858e6`，开发者工具应打开 `dist/dev/mp-weixin`。
- npm 10 直接安装最新版 Pinia 会与模板的 Vue 3.4 依赖冲突，因此固定 `pinia@2.1.7` 并提交 `.npmrc`。
- 店铺资料改为单独保存，保存后顾客端立即生效；店铺编辑不再把菜单状态误标成“有未发布修改”。
- `manifest.json` 固定微信基础库 `3.17.2`，构建产物中的 `project.config.json` 已确认写入该版本。
- 安装并加载微信开发者工具自带的 `wechatide-skill 0.3.11`。开发者工具 `2.02.2608080` 诊断兼容，CLI 授权成功，skill 版本关系为 `equal`。
- 当前版本是单设备演示，不支持登录、真实支付、云端同步和动态小程序码。

### 验证

- `npm ci`：成功，安装 567 个包并审计 568 个包。
- `npm run build:mp-weixin`：成功；编译器版本 `5.26 (vue3)`。
- 构建产物：7 个页面，AppID `wx3a13cbb8859858e6`，`compileType` 为 `miniprogram`。
- 微信模拟器：商家发布、规格购物车、失效项清理、结算、下单、模拟付款、订单列表和重置后的初始状态均已检查。
- 真机预览码：生成成功，包大小 `304695` 字节；用户已确认真机预览正常。
- 最终 console 执行 `grep -i error` 无匹配输出。
- `npm audit`：65 个问题（17 low、16 moderate、32 high）。`npm audit --omit=dev`：54 个问题（14 low、13 moderate、27 high）。未执行会破坏 DCloud 版本组的强制修复。

### 已知问题和待确认

- 构建会输出 Node 循环依赖警告：`Accessing non-existent property 'finally' of module exports inside circular dependency`，当前不影响产物生成。
- 开发者工具热更新曾出现 WXML 与页面 JS 映射不同步；执行 `cleanCompileCache` 后完整刷新可恢复，修改页面结构后建议留意此现象。
- `npm run devtools:open` 能定位本机 `cli.bat`，但传统 CLI 仍要求用户在“设置 → 安全”中开启服务端口；本次自动化验收改用已授权的 `wechatide` CLI。
- 图片选择和相机扫码依赖人工操作，尚未确认。

## 2026-10-09 后续规划

- 新增 `docs/production-roadmap.md`，规划顾客端与商家端分离、CloudBase MySQL、云函数、云存储、角色权限、真实订单和微信支付。
- 路线图先以单店真实运营为目标，数据结构预留多门店能力；当前只完成规划，没有创建云环境、数据库或支付配置。

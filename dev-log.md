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

## 2026-10-09 数据层迁移起步

- 将本地缓存实现从 `repository.js` 移到 `local-repository.js`，原有缓存键和页面调用路径不变。
- `repository.js` 改为适配器入口，集中约定店铺、菜单、购物车和订单方法；切换实现时会检查接口完整性。
- 这样接入 CloudBase 时可以新增云端适配器，页面不需要直接调用数据库 SDK。
- `npm run build:mp-weixin` 和开发模式编译均通过。微信模拟器打开 `pages/customer/menu?storeId=store-demo` 后，实际读取到店铺“禾间小馆”、分类“招牌推荐”。

### 下一步

- 确认 CloudBase 开发环境 ID、单店试点和商家 Web 管理端方案后，再实现登录、权限和云端 repository；目前仍使用本地数据和模拟付款。

## 2026-10-09 门店主页搭建

- 顾客启动页移除商家入口、演示数据说明和重置按钮，只保留扫码进入门店的顾客路径；商家工作台暂时仍可通过独立页面路径进入。
- 新增门店主页，扫码后先展示商家品牌内容和招牌菜，再进入菜单。
- 商家工作台新增三套主页模板、六种品牌色、首屏文案、区块显隐与排序、最多四个招牌菜选择，以及主页草稿和独立发布。
- 本地数据版本升级到 2；从版本 1 升级时只补主页数据，不覆盖已有店铺、菜单、购物车和订单。
- `docs/production-roadmap.md` 增加主页搭建的产品定位、数据表、服务接口、P0 优先级、迁移步骤和验收标准。首版明确不做自由画布或自定义代码。

### 验证

- `npm run build:mp-weixin` 成功，构建产物增加门店主页，共 8 个页面。
- 微信模拟器确认顾客启动页不存在原商家卡片和重置按钮。
- 门店主页实际渲染 4 个内容区块、3 个招牌菜；商家工作台实际渲染 3 套模板、4 个区块和 4 个菜品选项。
- 自动化完成“切换到清新自然模板 → 发布主页 → 顾客端读取 `fresh` 发布版本”，随后恢复暖意食堂模板。
- 清理编译缓存并重载后，console 的 `grep -i error` 无匹配输出。

### 后续

- 当前主页搭建和发布仍在本机缓存中，尚未具备跨设备同步、权限校验、发布审计和版本回滚。
- 商家工作台仍与顾客代码同包，只是顾客启动入口已移除；下一阶段迁移到响应式 Web 管理端。

## 2026-10-09 CloudBase 身份骨架

- 增加 `ordioApi` 云函数，首批提供 `session.get` 和 `entry.resolveTable`。
- 小程序端增加显式 CloudBase 环境配置和会话初始化；未配置环境时保持本地模式。
- 构建流程开始复制 `src/cloudfunctions`，并写入 `cloudfunctionRoot`。
- 补充 `users`、`store_members`、`stores`、`tables` 的首批字段和索引要求。

通过项目路径和 AppID 查询云环境均返回微信侧 `ret=1000 system error`，因此没有选择环境、部署函数或写入云数据。下一步先确认可用环境 ID，再创建集合、索引和试点门店数据。

`wx-server-sdk@4.0.2` 是本次查询到的当前 npm 版本，但其传递依赖审计仍报告 6 个问题（1 moderate、5 high）。`npm audit fix --force` 会降级到 `2.5.3`，本次未执行破坏性降级；部署前需要结合微信运行时兼容性继续处理。

## 2026-10-09 CloudBase 开发环境部署

- 开发环境确定为 `cloud1-d4gl08nvu64e07107`，本机通过 `.env.local` 配置，未提交环境文件。
- 创建 `users`、`store_members`、`stores`、`tables` 集合。
- 创建用户 OpenID 唯一索引、门店成员联合唯一索引和查询索引、桌台令牌唯一索引及门店桌台查询索引。
- `ordioApi` 已部署并进入 `Active`，运行时为 `Nodejs16.13`。
- `npm run check:cloudfunctions` 和 `npm run build:mp-weixin` 均通过；构建仍有已知的 Node 循环依赖警告。

### 下一步

- 在微信模拟器中首次调用 `session.get`，确认 OpenID 身份和 `users` 写入。
- 写入可重复使用的试点门店、成员和桌台种子数据。
- 联调有效、停用和不存在桌码，再把顾客扫码入口从本地令牌解析迁移到云函数。

`session.get` 已在微信模拟器显式调用成功，创建用户并返回空的成员关系。试点门店、店主成员、A01 和 A02 的可重复 upsert 文件已经写入 `cloudbase/seeds`；四项云写入当前等待开发者工具确认，确认前没有把它们记录为已完成。

## 2026-10-09 商家管理端拆分起步

- 新建 `apps/merchant-admin`，作为独立响应式 Web 管理端；顾客小程序首页不增加商家角色选择。
- 增加独立登录页、权限路由、经营概览和主页搭建页面。
- 主页搭建已支持三套模板、品牌色、首屏文案、实时手机预览和开发草稿保存。
- 开发服务器提供本地预览会话，生产构建不提供本地身份绕过；未配置商家 API 时保持在登录页。
- 原 `pages/merchant/index` 进入迁移状态，只用于核对尚未迁移的菜单和桌台功能。

### 验证

- `npm run build:merchant`：成功，产物写入 `dist/merchant-admin`。
- `npm run build:mp-weixin`：成功，现有顾客小程序未被商家端拆分破坏。
- 浏览器实际验证登录门禁、开发预览、经营概览、模板切换、文案实时预览和草稿保存。
- 桌面与 390px 宽移动布局已截图检查，浏览器控制台无错误。

### 后续

- 实现正式商家登录、Cookie 会话和 `store_members` 权限接口。
- 把主页草稿、发布版本、菜单和桌台从本地存储迁移到云端。
- 完成迁移后从顾客小程序删除商家页面和商家写接口。

# Ordio uni-app MVP 开发说明

## 技术和运行边界

- uni-app CLI、Vue 3、Vite、JavaScript、Composition API
- Pinia 只管理当前店铺和购物车
- `uni.setStorageSync`、`uni.getStorageSync` 保存本机演示数据
- 内部金额全部使用整数分
- 微信基础库固定为 `3.17.2`
- 商家端和顾客端位于同一个小程序，不代表跨设备同步

源码直接位于仓库根目录。微信开发者工具打开编译产物，不打开 `src`：

```text
开发：dist/dev/mp-weixin
构建：dist/build/mp-weixin
```

## 页面

| 页面 | 路径 |
| --- | --- |
| 演示入口 | `pages/index/index` |
| 商家工作台 | `pages/merchant/index` |
| 扫码入口 | `pages/customer/scan` |
| 顾客菜单 | `pages/customer/menu?storeId=store-demo` |
| 确认订单 | `pages/customer/checkout?storeId=store-demo` |
| 订单结果 | `pages/customer/order-detail?orderId=order-xxx` |
| 订单列表 | `pages/customer/orders?storeId=store-demo` |

## 数据规则

缓存键：

```text
ordio:mvp:version
ordio:mvp:stores
ordio:mvp:draft-menus
ordio:mvp:published-menus
ordio:mvp:carts
ordio:mvp:orders
```

页面通过 `repository.js` 和 `order-service.js` 读写数据。草稿发布时深拷贝为已发布菜单，顾客只能读取已发布内容。

店铺资料和菜单草稿分开保存。店铺资料保存后立即对顾客页生效；分类、菜品和规格只有发布后才进入顾客菜单。

购物车只保存菜品 ID、规格 ID 和数量。结算和创建订单时重新读取已发布菜单，校验菜品及规格并重新计算价格。订单保存商品名称、图片、规格、单价和数量快照。

## 开发约束

- 不单独升级 Vue、Vite 或某一个 `@dcloudio/*` 包
- 固定使用 `pinia@2.1.7`
- 不给 `package.json` 添加 `"type": "module"`，当前 uni-app 编译配置会因此失效
- 不提交 `node_modules/` 和 `dist/`
- 不使用 HBuilderX 编译，不直接修改构建产物
- 开发者工具使用稳定基础库，不使用灰度基础库
- 真实支付、登录、云数据库、评论和菜单画布不进入当前版本

## 2026-10-09 验收结果

- `npm ci` 成功，随后 `npm run build:mp-weixin` 成功。
- 构建产物包含 7 个页面，AppID 为 `wx3a13cbb8859858e6`，基础库为 `3.17.2`。
- 微信开发者工具 `2.02.2608080` 可打开开发产物，最终 console 错误筛选为空。
- 模拟器完成商家发布、规格选择、失效购物车项清理、结算、下单、付款和订单列表流程。
- 店铺名称单独保存后，顾客菜单立即读取到新名称，菜单发布状态未改变。
- 订单金额 `¥36.00`、规格“正常饭量”和已付款状态均由实际页面读取确认。
- 清空缓存并重新进入首页后，六个缓存键重新生成，购物车与订单为空，演示店铺恢复。
- 真机预览码已成功生成，代码包大小 `304695` 字节；手机扫码后的真机流程仍待人工确认。
- 图片选择、相机扫码和手机端交互依赖系统 UI，仍待人工确认。

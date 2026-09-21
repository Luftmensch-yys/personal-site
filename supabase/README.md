# 留言板：Supabase 设置与便签删除迁移

## 已有数据库（包含历史留言）

在 Supabase **SQL Editor** 中，以项目管理员身份粘贴并执行
[`migrations/20260916_note_delete_tokens.sql`](./migrations/20260916_note_delete_tokens.sql)
的**全部内容**。这是可直接执行的独立迁移文件，包含事务、表、函数、权限和 PostgREST schema cache 通知，不需要拼接其他 SQL。

本次开发没有执行线上迁移。请先执行迁移，再启用新版前端的创建/删除功能。迁移后旧版前端的直接 INSERT 会被拒绝，因此应协调前端更新时间。

- 不删除、不重建 `public.sticky_notes`，不修改已有便签内容、ID、时间或位置。
- 新增 `guestbook_private.note_ownership` 保存 `note_id → SHA-256(token)`；历史便签不生成所有权记录。
- 新增 `create_sticky_note` 与 `delete_sticky_note` RPC，收紧直接表写权限。
- 保留 `update_sticky_note_position` RPC，固定安全的 `search_path` 并限制 execute 权限。
- 可以重复运行；不会清空已有凭证或留言。运行完成后 SQL Editor 应成功提交整个事务。
- 迁移由管理员执行，函数应保持管理员所有权。不要向访客授予私有 schema/table 权限，也不要将其加入 API exposed schemas。

## 新项目

在 SQL Editor 执行 [`schema.sql`](./schema.sql) 全部内容。它先创建留言表，再包含与上述迁移相同的 SQL。无需再单独执行迁移文件。

## 删除所有权与安全边界

1. 浏览器为每张新便签生成独立 UUID 和 Web Crypto 256-bit 随机 token，不是所有便签共用一个 token。
2. 请求前将 token 保存到以项目 URL 和便签 ID 命名的 localStorage 键。使用独立键避免多个标签页互相覆盖；本地存储不可用时停止发布并提示。
3. `create_sticky_note` 在同一事务内插入便签和 token 哈希。没有 upsert 或认领接口，已存在的便签 ID 不能被覆盖或认领。token 不进入公共留言表或 SELECT 返回值。
4. 本地存在凭证时显示删除按钮，但这仅是 UI 判断。伪造 localStorage 可以伪造按钮，不能获得数据库删除权限。
5. `delete_sticky_note(note_id, owner_token)` 在服务器上验证 ID 对应的哈希。缺失、错误、跨便签 token、历史便签或已删除便签全部拒绝。成功删除时通过外键级联清理哈希。
6. 表不允许 anon/authenticated 直接 INSERT、UPDATE、DELETE；anon 只可 SELECT 和执行三项指定 RPC。没有 unrestricted DELETE policy，没有 service_role key，没有额外前端 secret。
7. 三项函数使用 `SECURITY DEFINER`、空 `search_path`、完全限定表名/哈希函数；同一事务内撤销默认 PUBLIC EXECUTE，再仅授予 anon。

原始 token 是持有即有权删除该张便签的凭证。不要分享它。另一个浏览器/无痕窗口没有 token，不能删除；同一浏览器同一站点的标签页共享 localStorage。清除站点数据、换浏览器、换站点域名后无法找回删除权。管理员仍可在 Supabase 后台管理旧便签和新便签。不会使用 Cookie 或账号系统。

公开的 Supabase anon key 是客户端 API 配置，不是删除授权。真正授权由数据库 RPC 和 RLS/对象权限完成。

## 本地配置

本地 `.env` 由用户自行配置 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`，不要提交或公开实际值。本次实现和测试不读取、输出或修改该文件。

```sh
npm ci
npm run dev
```

用户自行运行普通 Vite 命令时，它会按项目配置加载本地环境变量。测试命令使用独立配置，不加载 `.env`。

## 初次加载处理

旧代码在 `listNotes()` 完成前允许提交；随后 `notes = await listNotes()` 和全量重绘可以覆盖刚创建的便签。回归测试使用原版代码与延迟响应复现了这个竞态。加载阶段没有独立状态，失败后也只有错误提示，没有重试入口。

新版在 DOM 就绪后初始化，明确区分 loading/ready/error；首次读取成功前禁止提交。读取结果马上渲染，不依赖发布操作；GET 禁用缓存，对网络错误/502/503/504 仅立即重试一次，持续失败提供显式重试按钮。浏览器历史缓存恢复时重新读取。写请求不自动重试，避免响应丢失造成重复创建。

未读取线上配置或采集用户原先失败的首次请求，因此“创建后旧留言才出现”这一历史现象的唯一线上原因不能据此断言。已证实并修复的是上述竞态和初始化状态/失败恢复缺口；没有添加刷新页面或固定延迟补丁。

## 验证（推荐 Node.js 24.15+；JSDOM 也支持 22.22.2+ 的 22.x 或 26+）

```sh
npm test
npm run build -- --config tests/vite.config.js
npm run test:preview
```

- 自动测试用 JSDOM 执行实际页面脚本，以本地 PGlite PostgreSQL 执行真实迁移与 RPC，并切换 anon/authenticated/无权限角色验证授权。REST 适配器只在本地测试中模拟 PostgREST 的 HTTP 层。
- 覆盖旧版竞态复现、首次读取慢/失败/重试、创建、刷新、不同浏览器存储隔离、伪造凭证、错误/缺失/跨便签 token、历史留言保留和不可认领、禁止直接 DELETE、私有表不可读、最后一张删除后的空状态、拖动至坐标 0、CookieBanner 移除。
- `tests/vite.config.js` 设置 `envDir: false`，并只注入假配置。测试构建产物中的配置仅用于测试，不能直接作为生产部署产物。
- 测试预览在 `http://127.0.0.1:5174/contact.html`，接口在本机 5188 端口。只包含临时假数据；停止并重启后重置。

迁移之后，请用户在真实 Supabase 环境再确认首次进入/刷新、创建、创建者删除、无痕窗口无删除按钮、错误 token 被拒绝、历史便签仍存在、拖动正常。这里未执行任何线上数据写入或迁移。

安全设计参考：[PostgreSQL SECURITY DEFINER 与函数权限](https://www.postgresql.org/docs/16/sql-createfunction.html)。

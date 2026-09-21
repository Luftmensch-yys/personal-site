# 部署到 GitHub Pages 指南

本项目是 Vite + React 多页应用（含 Supabase）。部署采用 **GitHub Actions 自动构建 + GitHub Pages 托管**，
推送 `main` 分支后自动上线，无需本地手动构建。

## 一、一次性准备（只需做一次）

### 1. 初始化本地仓库并提交
> 之前项目里的 `.git` 是空的，需要重新初始化。

```bash
# 在 D:/App_Project/前端/个人（鱼 目录下
git init
git add .
git commit -m "Initial commit: 个人站点"
```

如果提示没有身份，先设置（用你 GitHub 的邮箱/用户名）：
```bash
git config user.name  "你的GitHub用户名"
git config user.email "你的GitHub邮箱"
```

### 2. 在 GitHub 上新建仓库
- 仓库名随便起，比如 `my-site`（最终网址是 `https://用户名.github.io/my-site/`）。
- **不要**勾选 "Add a README"（保持空仓库，方便第一次 push）。
- 拿到仓库地址，例如 `https://github.com/用户名/my-site.git`。

### 3. 关联远程并推送
```bash
git branch -M main
git remote add origin https://github.com/用户名/my-site.git
git push -u origin main
```

### 4. 配置 Supabase 密钥（Secrets）
因为 `.env` 不会进仓库，构建时需要把密钥以仓库 Secrets 形式注入：
1. 打开仓库 `Settings → Secrets and variables → Actions → New repository secret`
2. 添加两条：
   - `VITE_SUPABASE_URL` = 你的 Supabase 项目 URL
   - `VITE_SUPABASE_ANON_KEY` = 你的 anon key
（值和你本地 `.env` 里的一致）

### 5. 开启 GitHub Pages
1. 仓库 `Settings → Pages`
2. Source 选择 **GitHub Actions**
3. 首次 push 后，Actions 会自动跑构建并发布。

## 二、以后怎么更新网站

直接改代码 → `git add .` → `git commit` → `git push`，
GitHub Actions 会自动重新构建并部署，通常 1~2 分钟生效。

## 三、常见坑

- **页面白屏 / 资源 404**：基本都是 Vite `base` 路径不对。本配置已用
  `--base="/仓库名/"` 动态处理，改仓库名也不用改代码。
- **Supabase 报错**：检查第 4 步的 Secrets 是否填对，且变量名必须是
  `VITE_` 开头（Vite 只暴露 `VITE_` 前缀的环境变量给前端）。
- **本地预览生产构建**：`npm run build` 后资源路径是 `/仓库名/...`，
  直接双击 `dist/index.html` 打不开，需用 `npm run preview` 预览。
- **`npm ci` 失败**：确保 `package-lock.json` 已提交（本仓库已有）。

## 四、最终访问地址

```
https://用户名.github.io/仓库名/
```

如果想绑定自己的域名，在 `Settings → Pages → Custom domain` 填即可，
GitHub 会自动下发 HTTPS 证书。

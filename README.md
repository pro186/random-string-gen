# 随机长字符串生成器（Docker 可部署）

一个生成加密级安全随机长字符串的网页，附带 JSON API 接口。**零 npm 依赖**，镜像极小，可一键部署到 Docker。

> ## ⚠️ 安全警告
>
> - **不要在不受信任的网络/页面上使用**：在公网通过 HTTP 明文访问时，生成的字符串可能被中间人窃取或篡改。请务必通过 HTTPS（反向代理）访问。
> - **不要用它生成正式密码/长期密钥**：网页生成的字符串不适合作为正式账号密码或长期加密密钥。正式凭据请使用专业密码管理器（Bitwarden、KeePass 等）或本地命令（如 `openssl rand -base64 32`）生成并妥善保管。
> - **本工具是开源软件，按“原样”提供**：虽然随机数来自操作系统加密级随机源（Web Crypto / `crypto.randomBytes`），但作者不对生成内容的安全性做任何担保。
> - 详细说明见 [SECURITY.md](SECURITY.md)。发现安全漏洞请走私有报告渠道，**不要在公开 Issue 中披露**。

## ✨ 功能

- 生成长度 **1 ~ 1,000,000** 字符的随机字符串
- 可选字符集：小写字母 / 大写字母 / 数字 / 特殊符号 / 自定义字符
- 一次批量生成最多 100 条，逐行显示
- 一键复制、历史记录（点击条目复制）
- 基于浏览器 `crypto.getRandomValues`（加密级随机），拒绝采样消除模偏差
- 附带 REST API，方便脚本调用
- 不在服务器保存任何生成内容，服务端仅提供静态页面

## 🐳 Docker 部署（推荐）

### 方式一：docker compose

```bash
cd random-string-gen
docker compose up -d --build
```

### 方式二：直接 docker build

```bash
docker build -t random-string-gen .
docker run -d --name random-string-gen -p 3000:3000 --restart unless-stopped random-string-gen
```

启动后访问：**http://localhost:3000**

> 修改宿主机端口：把 `-p 3000:3000` 或 compose 里的 `"3000:3000"` 左边改成想要的端口，例如 `"8080:3000"`。

### 停止 / 删除

```bash
docker compose down          # 停止并移除容器
docker rmi random-string-gen # 删除镜像
```

## 🖥 本机直接运行（不需要 Docker）

需要 Node.js 18+：

```bash
node server.js
# 或用自定义端口
PORT=8080 node server.js
```

## 📡 API 接口

```
GET /api/random?len=64&charset=base62&count=3
```

| 参数 | 说明 | 默认 |
|---|---|---|
| `len` | 字符串长度（1 ~ 1,000,000） | 64 |
| `count` | 生成条数（1 ~ 100） | 1 |
| `charset` | `hex` / `base62` / `base64` / `alnum`，或任意自定义字符串 | base62 |

示例：

```bash
# 64 位十六进制字符串
curl "http://localhost:3000/api/random?len=64&charset=hex"

# 生成 5 条 32 位 base62
curl "http://localhost:3000/api/random?len=32&count=5"

# 自定义字符集
curl "http://localhost:3000/api/random?len=20&charset=abcdefghij123456"
```

返回 JSON：

```json
{
  "ok": true,
  "length": 32,
  "count": 5,
  "charsetSize": 62,
  "strings": ["..."],
  "generatedAt": "2026-01-01T00:00:00.000Z"
}
```

健康检查：`GET /api/health`（Docker 镜像内置 HEALTHCHECK 自动使用）。

## 📁 文件结构

```
random-string-gen/
├── index.html          # 前端页面（含生成逻辑）
├── server.js           # 零依赖 Node 服务（静态页 + API）
├── Dockerfile          # node:22-alpine 镜像
├── docker-compose.yml  # compose 一键部署
├── LICENSE             # MIT 许可证
├── SECURITY.md         # 安全政策（漏洞报告渠道）
└── .dockerignore
```

## 🔒 安全说明

- 随机数来源：浏览器端 `crypto.getRandomValues`，服务端 `crypto.randomBytes`，均为操作系统提供的加密级随机源
- 采用**拒绝采样**（rejection sampling）消除取模偏差，保证每个字符等概率
- 容器内以非 root 用户运行
- 生成内容不在服务器保存，前端生成不经过任何网络请求
- **部署到公网请务必使用 HTTPS**，避免字符串明文传输被窃取
- 漏洞报告与完整安全政策见 [SECURITY.md](SECURITY.md)（MIT 许可见 [LICENSE](LICENSE)）

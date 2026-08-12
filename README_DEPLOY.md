# Polymarket 实时盘口看板部署

目标结构：

```text
朋友浏览器 -> 你的域名 -> Caddy -> Node 服务 -> Polymarket
```

朋友只访问你的域名，不直接访问 Polymarket。

## 服务器要求

- Ubuntu 或 Debian
- Node.js 20+
- Caddy
- 域名 DNS 指向服务器公网 IP
- 服务器本身能访问 `https://polymarket.com`

## 上传目录

把本目录上传到服务器：

```text
/opt/polymarket-dashboard
```

至少需要这些文件：

```text
package.json
server.mjs
public/index.html
deploy/Caddyfile
deploy/polymarket-dashboard.service
```

## 安装依赖

项目本身没有 npm 依赖，只需要 Node.js。

```bash
node -v
```

如果低于 20，先安装新版 Node.js。

## 运行测试

```bash
cd /opt/polymarket-dashboard
npm start
```

另开一个终端：

```bash
curl http://127.0.0.1:8787/api/markets | head
```

能看到 JSON 就说明服务器能抓到 Polymarket。

## systemd 常驻

```bash
sudo cp deploy/polymarket-dashboard.service /etc/systemd/system/polymarket-dashboard.service
sudo systemctl daemon-reload
sudo systemctl enable --now polymarket-dashboard
sudo systemctl status polymarket-dashboard --no-pager
```

## Caddy 反向代理和 HTTPS

把 `deploy/Caddyfile` 里的 `your-domain.com` 换成你的域名，然后：

```bash
sudo cp deploy/Caddyfile /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Caddy 会自动申请 HTTPS 证书。

## 刷新频率

默认 15 秒缓存一次。要改频率，编辑 systemd service：

```text
Environment=CACHE_MS=15000
```

例如 30 秒：

```text
Environment=CACHE_MS=30000
```

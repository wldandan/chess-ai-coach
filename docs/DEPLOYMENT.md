# Chess Coach - 部署指南

## 概述

Chess Coach 使用双层架构：

```
Chrome Extension  ──WebSocket──►  WebSocket Gateway  ──HTTP──►  OpenClaw Gateway
                                           │                           │
                                      (公网暴露)                  (127.0.0.1 仅本地)
```

**为什么这样设计？**
- OpenClaw 包含隐私信息，不能直接暴露到公网
- WebSocket Gateway 作为中间层，只暴露必要的接口
- OpenClaw Gateway 完全在本地网络内

## 部署步骤

### 1. 服务器要求

- **操作系统**: Linux (CentOS/Ubuntu)
- **Node.js**: v18+
- **网络**: 开放 18790 端口 (WebSocket Gateway)

### 2. 安装依赖

```bash
# 安装 Node.js (如果还没有)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# 验证
node --version  # 应该显示 v18.x.x
npm --version
```

### 3. 部署 Chess Coach Gateway

```bash
# 创建目录
mkdir -p /opt/chess-coach
cd /opt/chess-coach

# 复制项目 (使用 git clone 或 scp)
git clone <your-repo-url> .
cd chess-coach

# 安装依赖 (注意：这也会安装 ws 库)
npm install

# 安装 OpenClaw (如果还没有)
# 参考 OpenClaw 官方文档安装
```

### 4. 配置 OpenClaw Gateway

确保 OpenClaw Gateway 在 `127.0.0.1:18789` 上运行：

```bash
# 检查 OpenClaw 状态
ps aux | grep openclaw

# 确认监听地址
netstat -tlnp | grep 18789
# 应该显示 127.0.0.1:18789
```

### 5. 配置防火墙

```bash
# 开放 WebSocket 端口 (18790)
firewall-cmd --permanent --add-port=18790/tcp
firewall-cmd --reload

# 或者使用 iptables
iptables -A INPUT -p tcp --dport 18790 -j ACCEPT
```

### 6. 启动 WebSocket Gateway

```bash
# 直接启动 (前台运行)
npm run gateway

# 或使用 systemd 服务 (后台运行)
```

### 7. 配置 systemd 服务 (推荐)

创建服务文件 `/etc/systemd/system/chess-coach-gateway.service`：

```ini
[Unit]
Description=Chess Coach WebSocket Gateway
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/chess-coach
ExecStart=/usr/bin/node src/api/gateway.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
systemctl daemon-reload
systemctl enable chess-coach-gateway
systemctl start chess-coach-gateway
systemctl status chess-coach-gateway
```

### 8. 验证部署

```bash
# 检查端口
netstat -tlnp | grep 18790
# 应该显示 0.0.0.0:18790

# 测试 WebSocket 连接 (使用 wscat)
npm install -g wscat
wscat -c ws://localhost:18790
# 应该收到连接成功消息
```

## 安全配置

### 防火墙规则 (推荐)

```bash
# 只允许特定 IP 访问 18790 端口
# 适用于固定 IP 的用户

# 允许特定 IP
iptables -A INPUT -p tcp --dport 18790 -s YOUR_IP -j ACCEPT

# 拒绝其他所有
iptables -A INPUT -p tcp --dport 18790 -j DROP
```

### Nginx 反向代理 (可选)

如果需要 SSL 和更复杂的认证：

```nginx
# /etc/nginx/conf.d/chess-coach.conf

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Basic Auth
    auth_basic "Chess Coach Gateway";
    auth_basic_user_file /etc/nginx/.htpasswd;

    location / {
        proxy_pass http://127.0.0.1:18790;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
}
```

## 架构图

```
┌──────────────────────────────────────────────────────────────────────┐
│                         用户浏览器                                    │
│                                                                      │
│   Chrome Extension                                                    │
│   ├── Popup UI (设置用户名、查看结果)                               │
│   ├── Content Script (注入 chess.com 抓取 PGN)                     │
│   └── WebSocket Client ──────────────────────────────────────────┐   │
└────────────────────────────────────────────────────────────────────│
                                                                       │
                    WebSocket (wss://your-server.com:18790)           │
                                                                       │
┌──────────────────────────────────────────────────────────────────────│
│                      你的服务器 (124.156.195.28)                    │
│                                                                      │
│   ┌─────────────────────────────────────────────────────────────┐    │
│   │            WebSocket Gateway (:18790)                      │    │
│   │  • 接收 Extension 连接                                     │    │
│   │  • JSON-RPC 协议解析                                       │    │
│   │  • 转发请求到 OpenClaw                                    │    │
│   │  • 返回结果给 Extension                                    │    │
│   └──────────────────────────┬────────────────────────────────┘    │
│                              │                                        │
│                              │ HTTP (仅本地 127.0.0.1)               │
│                              ▼                                        │
│   ┌─────────────────────────────────────────────────────────────┐    │
│   │          OpenClaw Gateway (:18789)                         │    │
│   │  • chess-orchestrator                                     │    │
│   │  • chess-engine (Stockfish)                               │    │
│   │  • chess-analyst (LLM)                                    │    │
│   │  • chess-reviewer                                         │    │
│   │  • chess-gamification                                     │    │
│   │                                                           │    │
│   │  ⚠️ 包含隐私信息 (API Keys, 用户数据等)                  │    │
│   │  ⚠️ 只监听 127.0.0.1，不对外暴露                         │    │
│   └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## 故障排查

### WebSocket Gateway 无法启动

```bash
# 检查端口占用
netstat -tlnp | grep 18790

# 查看错误日志
node src/api/gateway.js
```

### Chrome Extension 连接失败

1. 检查服务器防火墙是否开放 18790 端口
2. 检查 WebSocket Gateway 是否正常运行
3. 查看 Chrome 扩展的 console 日志

### OpenClaw Gateway 无响应

```bash
# 检查 OpenClaw 状态
ps aux | grep openclaw

# 检查端口
netstat -tlnp | grep 18789

# 查看 OpenClaw 日志
# 参考 OpenClaw 官方文档
```

## 更新

```bash
cd /opt/chess-coach
git pull
npm install
systemctl restart chess-coach-gateway
```

# Agent Era - 游戏前端

AI驱动的智能世界游戏前端

## 部署说明

### Cloudflare Pages 部署

1. 在 Cloudflare Dashboard 创建 Pages 项目
2. 连接 GitHub 仓库
3. 构建设置：
   - 构建命令：留空（纯静态文件）
   - 输出目录：`/`

### 配置后端API地址

在 `index.html` 中修改：

```html
<script>
    // 生产部署：取消注释并修改为实际后端地址
    window.GAME_API_URL = 'https://your-api-domain.com';
</script>
```

## 本地开发

直接用任意静态服务器托管此目录即可，例如：

```bash
# Python
python -m http.server 8080

# Node.js
npx serve .
```

## API 接口

- `POST /apigame/aigame/init/Get` - 获取初始化数据
- `POST /apigame/aigame/npc/GetByCid` - 获取NPC列表
- `POST /apigame/aigame/history/Get` - 获取NPC历史记录

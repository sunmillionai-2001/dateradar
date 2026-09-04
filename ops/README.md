# DateXray Operations Workbench

这是 `@DateXray` 的本地运营工作台，与公开站代码和部署完全隔离。当前实现 X 内容工作流；TikTok 和 Reddit 只保留入口。

## 本地启动

要求 Node.js 20.9 或更新版本。

```bash
cd /Users/sunbaogangdemac/dateradar/ops
npm install
cp .env.example .env.local
```

编辑 `.env.local`，只填服务端 DeepSeek key：

```bash
DEEPSEEK_API_KEY=your_key_here
```

不要把 key 写进源码、JSON、测试、日志或 Git。启动工作台：

```bash
npm run dev
```

浏览器打开 [http://127.0.0.1:3100](http://127.0.0.1:3100)。开发服务器只监听本机回环地址。

## 工作流

1. Dashboard 查看今天的节奏：反诈、进度、互动各一条。
2. X studio 输入素材或导入最近 7/14/30 天的 Git 提交。
3. 选择六类内容之一，用 DeepSeek 生成三版不超过 280 字符的英文推文。
4. 编辑后点击 **Copy and log**。复制成功后，最终版本自动写入本地台账。
5. 在 Ledger 搜索或复用历史内容。
6. 发布后在 Review 回填 X 链接、发布时间和互动数据，并标记高表现内容。

工作台不会连接 X 账号，也不会自动发布任何内容。

## 本地数据与 Git

可提交的静态配置：

- `data/brand-voice.json`
- `data/content-types.json`
- `data/visual-templates.json`
- `data/topics.example.json`
- `data/content-ledger.example.json`

只保留本地、已被 `/ops/.gitignore` 忽略的运行数据：

- `data/topics.json`
- `data/content-ledger.json`
- `data/*.tmp`
- `.env.local`

首次读取时，工作台从对应的 `*.example.json` 自动创建本地运行文件。数据跟随当前电脑，不会自动上传或备份；如需备份，请自行复制两个运行 JSON 到安全的私有位置。

## 检查命令

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

公开站仍从仓库根目录独立运行：

```bash
cd /Users/sunbaogangdemac/dateradar
npm run dev
```

它不会加载 `/ops` 的依赖、页面或运行数据。

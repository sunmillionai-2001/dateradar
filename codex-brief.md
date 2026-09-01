# Codex 开发任务书 — DateXray MVP

日期:2026-09-01 · 版本:v1.2(Claude + Whisper 默认,预留 DeepSeek 切换)

## 你的角色

你是 DateXray 的全栈开发工程师。本项目目录下还有两份文档,**开工前必须完整阅读**:

- `product-spec.md` — 产品规格书(页面、报告字段、定价、合规、里程碑)
- `signals-library.md` — 信号库 v1.0(25 条信号 + 风险叠加规则)

本任务书是执行总纲。**严格按第 7 节里程碑顺序开发,每完成一个里程碑就停下来向用户汇报、等验收,不要一次性生成整个项目。**

---

## 1. 项目概述

DateXray 是一个面向美国英语用户的"约会关系风险雷达"网站:

```
用户粘贴一段约会聊天记录,或上传聊天截图,或上传约会录音
  → (截图模式)OCR 转文字;(音频模式)语音转文字
  → AI 按信号库逐条对照对话文本
  → 输出结构化风险报告(风险等级 + 六类雷达图 + 证据链 + 应对话术)
```

核心验证链路:对话文本 → LLM 结构化分析 → 渲染报告。

## 2. 技术栈(必须遵守)

| 环节 | 方案 |
|---|---|
| 框架 | Next.js(App Router)+ TypeScript + Tailwind CSS |
| 部署 | Vercel(零运维,一键部署) |
| 分析引擎 | **Anthropic Claude API(默认)**,通过 `AI_PROVIDER` 可切换 **DeepSeek API** |
| 语音转文字 | **OpenAI Whisper API**(音频模式) |
| 截图 OCR | **Tesseract.js(浏览器本地)**:免费、无 key、截图不出设备;OCR 结果作为**可编辑草稿**供用户修正后提交 |
| 聊天记录模式 | 粘贴文本 + 截图 OCR,作为无音频时的合规友好入口 |
| 收款 | 开发模式解锁起步;后期接 Paddle(MoR)或 Stripe |
| 数据库 | MVP 尽量不用;登录防滥用后期用 Supabase |

**AI 引擎可切换设计(重要)**:
- 在 `src/lib/ai/` 下做一个 provider 抽象:一个 `analyze(transcript)` 函数,内部根据环境变量 `AI_PROVIDER` 选择调用 Claude 还是 DeepSeek。
- `AI_PROVIDER=anthropic` → 调 Claude;`AI_PROVIDER=deepseek` → 调 DeepSeek。
- **两个 provider 必须输出完全相同的 JSON schema**,对外接口无差别。这是硬要求,方便用户随时切换、也作为 Anthropic 注册不便时的备用方案。

## 3. 目录结构建议

```
dateradar/
├── codex-brief.md
├── product-spec.md
├── signals-library.md
├── src/
│   ├── app/            # 页面路由
│   ├── components/     # 组件
│   ├── lib/ai/         # provider 抽象:claude.ts / deepseek.ts / index.ts
│   ├── lib/            # 信号库加载、提示词构造
│   └── types/          # 报告 JSON 类型
└── public/
```

## 3.5 代码管理(Git 规范)

- **远程仓库已配置**:`https://github.com/sunmillionai-2001/datexray.git`(origin,main 分支,已连通)
- **提交节奏**:每完成一个里程碑,执行 `git add -A && git commit -m "<阶段说明>" && git push origin main`;重要功能点完成也可随时提交,不要攒到很晚
- **安全**:`.gitignore` 已存在(`node_modules`、`.env*.local` 等已被排除);**绝不提交 `.env.local` 或任何 API key**(硬约束第 3 条)
- **提交信息**:用英文简述本阶段改动,一条信息对应一件事

## 4. 功能需求(按页面)

| 页面 | 核心功能 |
|---|---|
| `/` Landing | 产品一句话定位 + 反诈数据背书("FBI 统计浪漫诈骗年损失超 $6 亿")+ CTA |
| `/analyze` | 三个入口:① 粘贴聊天记录 ② 上传聊天截图(支持多张,OCR 转文字,可编辑草稿) ③ 上传音频(录音 ≤10 分钟);录音前知情提示 |
| `/report/:id` 免费版 | 风险等级徽章(低/中/高/🔴)+ 六类雷达图 + 一句话总评 + 免责声明;**一屏、美观、可截图**;底部 CTA 引导解锁 |
| `/report/:id` 付费版(解锁后) | 证据链(命中信号 + 原文引用 + 时间戳)+ 信号解读 + 应对话术 + 下次约会观察清单 + 只读分享链接 |
| 解锁 | MVP 用"开发模式"直接解锁;接 Paddle/Stripe 后走真实支付 |
| `/legal` | TOS / Privacy / Disclaimer 三页 |

## 5. 分析接口规范

- `POST /api/analyze`,body:`{ "transcript": "对话文本" }`,返回报告 JSON
- 服务端调用 `lib/ai/analyze()`,输出**固定 JSON schema**(见 product-spec.md 第 5 节)
- **可复现要求**:temperature=0、固定 schema、禁止多余/缺失字段
- 信号库:读取 `signals-library.md`,开发时生成 `signals.json`,注入提示词(结构见 signals-library.md 附录)

## 6. 提示词结构

遵循 product-spec.md 第 9 节:系统提示词明确"只报命中行为信号、绝不输出'渣/渣男/渣女'等定性标签、严格输出固定 JSON、不确定时不命中(宁可漏报)"。Claude 侧用 `response_format`/结构化输出(Anthropic SDK 的 tool-use 或 json 模式);DeepSeek 侧用 `response_format: { "type": "json_object" }`。

## 7. MVP 里程碑(顺序执行,每步验收)

| # | 内容 | 验收标准 |
|---|---|---|
| **M1** | 项目初始化 + Landing + Analyze 页(粘贴聊天记录 + 上传音频入口) | `npm run dev` 能跑,能粘贴文本/上传音频并显示"分析中"状态 |
| **M2** | 输入转换层:接 Whisper(音频→文字)+ Tesseract.js(截图→文字,可编辑草稿);**音频/图片用后即删** | 10 分钟音频 < 60 秒出文字;支持多张截图上传;服务器不留存音频和图片 |
| **M3** | 接 AI 分析(Claude 默认,DeepSeek 可切)+ 生成 signals.json + 免费报告页(雷达图/等级/总评) | 用第 9 节测试对话,输出固定 JSON 并正确渲染;**同段对话重复分析结果一致** |
| **M4** | 付费墙:报告内容锁定 + 开发模式解锁(有收款账号再切 Paddle/Stripe) | 免费版→付费版解锁流程通,订单逻辑有记录 |
| **M5** | 合规完善:免责/隐私/TOS、录音知情提示、限流、错误处理 | 自查清单全过,可部署 Vercel |

## 8. 硬性约束(违反即不合格)

1. **措辞红线**:报告只报"命中信号 + 行为证据",**绝不输出"渣/渣男/渣女/骗子"等定性标签**。
2. **音频/截图即删不存**:转文字/OCR 完成后立即删除原始音频与图片;不做任何分享/公开/存储功能。
3. **API key 安全**:所有 key 走环境变量(本地 `.env.local`,生产用 Vercel 环境变量),**不得硬编码、不得提交 git**。
4. **可复现**:分析输出必须固定 schema、固定参数(temperature=0)。
5. **产品文案不得教唆用户偷录**。
6. **provider 一致**:Claude 与 DeepSeek 两个 provider 输出同一 JSON schema(见第 2 节)。

## 9. 内置测试对话(用于 M3 验收与回归)

### 测试 1:正常对话(预期:低风险)
```
Alice: Hey! So glad we finally met up.
Bob: Me too! You're even nicer than your profile.
Alice: Haha thanks, I was a bit nervous honestly.
Bob: No need, this is going well. Wanna grab dinner next week?
Alice: Yeah! Are you free Thursday?
Bob: Thursday works. Want to try that Italian place on 5th?
Alice: Love it, I'll book it.
Bob: Awesome, can't wait.
```

### 测试 2:中风险(预期:命中回避承诺/养鱼信号)
```
Mia: Good morning babe 😊
Jake: Morning.
Mia: You were quiet yesterday, everything ok?
Jake: Yeah just busy.
Mia: It'd be nice to see you this weekend, maybe finally meet your friends?
Jake: Hmm, they're a bit wild, maybe another time.
Mia: We've been seeing each other 4 months now, I hoped we could talk about where this is going.
Jake: Let's not put pressure on things, go with the flow. I really like you though.
Mia: I like you too, I just want to know we're on the same page.
Jake: We are. Anyway I gotta run, talk soon.
```

### 测试 3:杀猪盘(预期:🔴 红色预警,命中骗财型)
```
David: Hello beautiful, I hope this finds you well.
Sarah: Hi David! How's your week?
David: Stressful, but seeing your message made my day. I have something exciting to share.
Sarah: Oh? What is it?
David: I've been trading crypto and made 3x my money. I want to teach you so we can build a future together.
Sarah: I don't know anything about crypto.
David: That's fine, I'll guide you. I'm on an oil rig overseas so can't video call due to security, but I promise I'm real. Send me $500 to start and I'll show you.
Sarah: That seems like a lot...
David: My love, trust me. If you really care about our future you'll do this. I'll pay you back double.
```

**验收口径**:测试 1 必须低风险;测试 2 必须命中回避承诺/养鱼类;测试 3 必须红色预警且命中骗财型。任一不符,回到 M3 调提示词/信号库。

## 10. 环境变量清单

| 变量 | 必需? | 说明 |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅(默认分析引擎) | Claude key |
| `OPENAI_API_KEY` | ✅(音频转文字) | Whisper key |
| `DEEPSEEK_API_KEY` | 可选 | 预留:想切 DeepSeek 时填,并设 `AI_PROVIDER=deepseek` |
| `AI_PROVIDER` | 可选 | `anthropic`(默认)或 `deepseek` |
| `DEV_MODE` | ✅(初期) | `true` 时付费报告直接解锁,方便验收 |

- 本地:`.env.local`;生产:Vercel Settings → Environment Variables。
- `README.md` 需写明本地运行方法、环境变量清单、部署 Vercel 步骤。

## 11. 交付要求

- 完成后输出:① 代码已按里程碑 commit 并 **push 到远程 origin main**;② 一份 `README.md`。

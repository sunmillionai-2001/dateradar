# 信号库 v1.0 — DateRadar

> 这是产品的**核心内容资产**。AI 依据本库逐条对照对话转写文本,输出结构化风险报告。
> 原则:只写**可观察行为**,不写人格标签。报告只报"指标异常",不下"确诊"结论。

---

## 使用说明

- **男女通用**:底层信号为行为模式,不分性别(爱情轰炸、煤气灯等男女都会做)。前端呈现时按用户视角切换措辞,判据不变。
- **每条信号结构**:ID / 信号名(英文,产品端显示)/ 分类 / 风险等级 / 行为判据(AI 判据)/ 示例话术 / 防误判(AI 据此排除误报)/ 来源。
- **来源标注**:`共识` = 海外博主高频共识;`官方` = FTC/FBI 等政府数据或定义;`新增` = 研究后补入。

---

## 一、六大分类总览

| 分类 | 含义 | 条数 |
|---|---|---|
| ① 回避承诺型 `Avoidant / Non-committal` | 拒绝定义关系、不谈未来、不进入对方生活 | 4 |
| ② 索取型 `Extractive / Taker` | 单向索取物质/情绪,付出不对等 | 4 |
| ③ 养鱼/多线型 `Breadcrumbing / Multi-dating` | 忽冷忽热、不承诺不放手、并行约会 | 3 |
| ④ 操控型 `Manipulative / Narcissistic` | 打压、煤气灯、爱情轰炸、情绪勒索等 | 6 |
| ⑤ 隐瞒/伪装型 `Deceptive` | 身份矛盾、回避见面、伪装"好人" | 5 |
| ⑥ 骗财型 `Scam / Red-Alert` | 恋爱诈骗/杀猪盘,命中即红色预警 | 3 |

**合计 25 条。**

---

## ① 回避承诺型(4条)

### S01 回避定义关系 `Avoids defining the relationship`
- **风险等级**:中
- **判据**:认识超过 1 个月,主动问"我们是什么关系/在交往吗",对方 ≥2 次转移话题、打太极,不给出明确回应。
- **示例**:"Let's just go with the flow." / "Why do we need a label?"
- **防误判**:认识 2 周内的初期阶段不算;对方明确说"我单身但不想恋爱"是诚实声明,不算回避。
- **来源**:共识

### S02 不谈未来 `Avoids discussing the future`
- **风险等级**:中
- **判据**:回避所有未来向话题(共同出行、见朋友、长期打算),反复把话题拉回当下。
- **示例**:"Let's not get ahead of ourselves." / "One day at a time."
- **防误判**:认识 1 个月内属正常节奏。
- **来源**:共识

### S03 不带你进社交圈 `Keeps you out of their social circle`
- **风险等级**:中
- **判据**:认识超过 3 个月,从未见过对方任何朋友/家人/同事,且回避此类邀约。
- **示例**:"My friends are all crazy, I'd rather keep you to myself."
- **防误判**:对方社交圈本身就小或家人异地时,需结合其它信号;认识初期(1 个月内)不适用。
- **来源**:共识

### S04 名分暧昧 `Keeps the relationship ambiguous`
- **风险等级**:中
- **判据**:享受伴侣待遇(亲密、陪伴、花费),却长期拒绝伴侣名分,处于"准恋爱"状态。
- **防误判**:双方默认的 casual dating 不算;关键看是否"享受权利、不担义务"。
- **来源**:共识

---

## ② 索取型(4条)

### S05 高频索要 `Frequent requests for gifts/money`
- **风险等级**:中
- **判据**:认识 1 个月内 ≥2 次主动提出物质需求(礼物、转账、"帮我付一下"),且无对等付出。
- **示例**:"Babe, can you send me $50 for my phone bill?" / "You'd look great in this bag 😉"
- **防误判**:偶尔一次有明确事由不算;看**密度**和**单向性**。
- **来源**:共识

### S06 单向付出 `One-sided effort`
- **风险等级**:中
- **判据**:金钱/时间/情绪投入长期单方向(你付出多,对方回馈少),对方把付出当理所当然。
- **示例**:"You should pay, that's what you're supposed to do."
- **防误判**:需观察 1 个月+;热恋期双方主动付出多,不适用。
- **来源**:共识

### S07 卖惨借钱 `Leverages hardship to extract money`
- **风险等级**:高
- **判据**:编造或夸大经济困难(房租、医疗、家人急用)向你借钱。
- **示例**:"My landlord's kicking me out, can you help this once?" / "My mom's in the hospital, I'm short..."
- **防误判**:真实困难也可能存在,但"认识不久 + 借钱 + 催得急"组合要警惕;与 S23(骗财)联动判定。
- **来源**:共识 + 官方(FTC 统计"生病/受伤/坐牢需钱"为最高频借口,占报告 24%)

### S08 理所当然话术 `Entitlement language`
- **风险等级**:低
- **判据**:用义务式话术施压,认为你为其付出是"应当"。
- **示例**:"If you really loved me, you'd do this." / "You don't care about me if you won't help."
- **防误判**:需结合文化语境(部分文化中请客礼节常见);单次出现不算,看是否成为模式。
- **来源**:共识

---

## ③ 养鱼/多线型(3条)

### S09 忽冷忽热 `Hot and cold pattern`
- **风险等级**:中
- **判据**:热情-冷淡周期循环出现,冷淡期无合理解释、不主动说明。
- **示例**:密集聊天几天后突然回复变慢变短,"Sorry, been busy."
- **防误判**:对方真实忙碌的阶段不算;看**周期规律性**而非单次。
- **来源**:共识

### S10 不承诺不放手 `Keeps you on the hook without committing`
- **风险等级**:中
- **判据**:明确表示"没准备好恋爱",但持续与你亲密联系、享受陪伴。
- **示例**:"I'm not ready for a relationship... but I love talking to you."
- **防误判**:对方言行一致地只维持友谊、不越界时,不算。
- **来源**:共识

### S11 模糊多线迹象 `Signs of parallel dating`
- **风险等级**:中
- **判据**:回避带你进入其公开场合;对"最近在忙什么"答非所问;存在多个暧昧关系的迹象。
- **防误判**:欧美 dating 初期多线约会本身不算异常;关键在是否**欺骗你对专一的预期**。
- **来源**:共识

---

## ④ 操控型(6条,危险)

### S12 打压式开场 `Negging`
- **风险等级**:高
- **判据**:以"玩笑"包装的贬低,系统性抬高自己、贬低你。
- **示例**:"You're actually smarter than you look." / "I usually date models, but I'll make an exception."
- **防误判**:偶尔一句幽默不算;看是否**持续、系统、单方向**。
- **来源**:共识(PUA 起源概念,多源验证)

### S13 煤气灯 `Gaslighting`
- **风险等级**:高
- **判据**:否认你明确记得的事实或说过的话,让你怀疑自己的记忆和判断。
- **示例**:"I never said that. You're imagining things." / "That's not what happened, you're too sensitive."
- **防误判**:必须**多次出现**才判定,单次不算。
- **来源**:共识

### S14 爱情轰炸后撤回 `Love bombing then withdrawal`
- **风险等级**:高
- **判据**:认识极短时间(2 周内)给出强烈情感承诺("灵魂伴侣""非你不可"),之后突然冷淡/撤回。
- **示例**:"You're my soulmate, I've never felt this way about anyone." → 几周后突然消失
- **防误判**:**不是所有初期热烈都是毒性**(焦虑型依恋的人也会热烈);关键在"撤回"行为和控制意图。宁可漏报,不要误伤真心热烈者。
- **来源**:共识(研究显示 love bombing 是博主们强调最多的早期信号;同时附临床谨慎提醒)

### S15 情绪勒索 `Emotional blackmail`
- **风险等级**:高
- **判据**:用内疚感、害怕失去来操控你的行为。
- **示例**:"If you really loved me, you'd..." / "You'll regret this."
- **防误判**:偶尔情绪化表达不算;看是否成为固定操控模式。
- **来源**:共识

### S16 独占社交时间 `Monopolizing social time` *(新增)*
- **风险等级**:中
- **判据**:新关系初期就要求占据你几乎所有社交时间,并表现出对你与朋友/家人相处的阻挠或不安,试图把你从原有社交圈剥离。
- **示例**:"Why do you need to see your friends so much? I want you all to myself."
- **防误判**:初期热恋期的陪伴需求不算;关键在**阻碍你见朋友/家人**,而非"想多陪你"。与 S03 方向相反(S03 是对方不带你进 TA 的圈,本条是对方把你从你的圈里拉走)。
- **来源**:共识(博主 Sabrina Zohar)

### S17 武器化你的脆弱 `Weaponizes vulnerabilities / therapy baiting` *(新增)*
- **风险等级**:高
- **判据**:在冲突时,用你曾吐露的脆弱(家庭创伤、自卑点、过往失败、心理治疗内容)反过来攻击你。
- **示例**:"No wonder your dad left you."(针对对方吐露过的家庭创伤)
- **防误判**:必须是**恶意使用**而非无心失言;出现 1 次即应标记,出现 2 次以上升高。
- **来源**:共识(流行概念 spider-webbing 的核心组成之一)

---

## ⑤ 隐瞒/伪装型(5条)

### S18 身份信息矛盾 `Contradictory identity details`
- **风险等级**:中
- **判据**:职业、居住地、学历、年龄等核心信息前后说法不一致。
- **示例**:说做金融,后来说做医疗;说住 A 城,又说在 B 城出差数月。
- **防误判**:日常小事记错不算;**核心身份信息矛盾**才标记。
- **来源**:共识

### S19 回避视频/见面 `Avoids video calls and meeting in person`
- **风险等级**:中
- **判据**:长期拒绝视频通话、拒绝线下见面,理由永远在变。
- **示例**:"My camera's broken." / "I'm traveling for work." / "Next month for sure."
- **防误判**:短期确实忙碌不算;超过 1 个月且无明确见面计划要警惕。与骗财型联动。
- **来源**:共识 + 官方(FTC 将"永远无法见面"列为强诈骗指标)

### S20 社交痕迹异常 `Abnormal social media presence`
- **风险等级**:中
- **判据**:声称在当地生活多年,却账号空白、刚注册、零历史痕迹。
- **防误判**:本身注重隐私的人账号少是正常;需结合其它信号。
- **来源**:共识

### S21 对服务人员态度恶劣 `Mistreats service staff` *(新增)*
- **风险等级**:中
- **判据**:在自认为无人注意时,对服务员、司机、店员表现出轻蔑、粗鲁——用于识别"伪装的好人"。
- **示例**:对服务员呼来喝去、对店员颐指气使。
- **防误判**:偶尔情绪失控不算;看"**对强者讨好、对弱者傲慢**"的规律性。单独出现仅作提示,不单独升高风险。
- **来源**:共识(博主 Matthew Hussey"服务员测试")

### S22 抹黑所有前任 `All exes are crazy` *(新增)*
- **风险等级**:中
- **判据**:将所有前任统一描述为"疯子/渣/神经病",无任何自我反思。
- **示例**:"All my exes were crazy." / "Every girl I dated was toxic."
- **防误判**:单次抱怨一个糟糕前任是正常的;关键在**无差别全部抹黑 + 零自省**。
- **来源**:共识(博主 Matthew Hussey)

---

## ⑥ 骗财型(3条,🔴 命中即红色预警)

### S23 快速推进+经济需求 `Rapid intimacy + financial requests`
- **风险等级**:🔴 严重
- **判据**:几天内感情急速升温(很快"亲爱的""my love"),随即提出金钱需求。
- **示例**:"My love, I need $200 for my visa, I'll pay you back in a week."
- **补强线索(官方数据)**:FTC 统计最高频借钱借口 = 自己/家人生病、受伤、坐牢(占报告 24%)。
- **防误判**:此类组合**几乎必为诈骗**,命中即红色预警。
- **来源**:共识 + 官方

### S24 诱导投资 `Pushes investments/crypto`
- **风险等级**:🔴 严重
- **判据**:主动分享"稳赚"项目、加密货币、外汇平台,并引导你入金;FBI 官方命名为"杀猪盘 pig butchering"(先建立恋爱关系,再引入虚假投资平台,鼓励投入越来越多、最终无法提现)。
- **示例**:"I tripled my money on this crypto, let me show you how to invest."
- **补强线索(官方数据)**:FTC 统计"教你投资赚钱"类借口占报告 18%;骗子会把支付引导到**银行转账 / 加密货币**等不可逆方式。
- **防误判**:命中即红色预警。
- **来源**:共识 + 官方(FBI IC3 报告明确定义)

### S25 编造光鲜身份+永不见面 `Fabricated persona, never meets`
- **风险等级**:🔴 严重
- **判据**:身份极其光鲜(军官、石油工程师、海外医生),且永远有理由无法见面。
- **示例**:"I'm on a military base overseas, I can't video call for security reasons."
- **补强线索(官方数据)**:FTC 列出的高频"无法见面"借口 = 驻外、石油平台、被扣留在外国。
- **防误判**:命中即红色预警。
- **来源**:共识 + 官方

---

## 风险叠加规则(报告据此计算风险等级)

| 命中情况 | 报告风险等级 |
|---|---|
| 命中 1 条(非🔴) | 低 "仅观察到单项特征,建议留意,不必过早下结论" |
| 命中 2–3 条(非🔴) | 中 "命中多项,建议结合下次约会继续观察" |
| 命中 ≥3 条,或含 ≥2 条操控型(S12–S17),或含 ≥2 条索取型(S05–S08) | 高 "存在明显风险模式,建议警惕" |
| 命中 ⑥类任何一条(S23–S25) | 🔴 红色预警 "高度疑似情感诈骗,建议立即停止资金往来,并参考防诈提示" |

**补充**:风险等级达到高/🔴 时,报告应附上"风险人群提示"背景信息(FBI 统计浪漫诈骗受害者 60+ 占 43% 投诉、58% 损失;支付方式以银行转账/加密货币为主,属不可逆支付)——作为教育内容,不参与信号判据。

---

## 附:给 AI/Codex 的信号库 JSON 结构

信号库最终以结构化 JSON 注入分析提示词。字段结构:

```json
{
  "schema_version": "1.0",
  "signals": [
    {
      "id": "S14",
      "name_en": "Love bombing then withdrawal",
      "name_zh": "爱情轰炸后撤回",
      "category": "manipulative",
      "severity": "high",
      "judging_criteria": "Promises intense commitment within ~2 weeks, then suddenly withdraws/becomes cold.",
      "example_lines": ["You're my soulmate.", "I've never felt this way about anyone."],
      "avoid_misjudgment": "Not all early intensity is toxic (anxious attachment). Key is the withdrawal and control intent. Prefer under-reporting over mislabeling genuine enthusiasm."
    }
  ]
}
```

> 完整 25 条的英文 `judging_criteria` / `avoid_misjudgment` 由开发阶段依据本中文文档逐条翻译填充(字段表已完整)。开发时确保输出 schema 固定、同参数重跑,保证结果可复现。

---

## 版本记录

- **v1.0(2026-08-31)**:基于 21 条初稿 + 深度研究(105 agent / 23 信源 / 25 条对抗验证)定稿。
  - 新增 4 条:S16 独占社交时间、S17 武器化脆弱、S21 服务人员态度、S22 抹黑前任。
  - 补强:S07/S23/S24/S25 注入 FTC/FBI 官方脚本数据。
  - 淘汰:"harmless rejection"(验证未通过,不入库)。
  - 待补:国内抖音/小红书/公众号鉴渣观点本轮研究未通过来源验证,如打国内市场需单独补研究。

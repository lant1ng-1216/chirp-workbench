# 鸣 Ming · 产品规划书

> 当前版本：本地 Demo（无登录 / 无存储 / 无真实 API 连接）  
> 记录所有已完成功能、待开发功能、以及需要外部依赖才能实现的功能。

---

## 一、已完成

### 设计系统
- [x] ELN 暖色设计语言（`#faf9f7` 底色、Noto Serif SC + Space Mono + Noto Sans SC 字体体系）
- [x] 全局字体加载至 `app/layout.tsx <head>`
- [x] 统一色彩 Token（C.bg / C.ink / C.accent / C.gold 等）
- [x] 关键帧动画（labFadeUp / labBlink / labPulse / agSpin 等）

### 官网（Landing Page）
- [x] Navbar：Logo + 导航 + CTA
- [x] Hero：SERIF 大标题 + MONO 眼标签 + 滚动提示
- [x] HowItWorks：编辑排版三列表格
- [x] Features：2 列网格 + 装饰分割线
- [x] PlatformGrid：国内/海外平台分类展示
- [x] Footer

### Onboarding（品牌创建）
- [x] 左侧步骤导航 + 右侧输入卡片，ELN 暖色风格
- [x] 4 步流程：输入品牌网址 → 解析信息 → 预览 → 完成
- [x] 创建品牌档案写入 Zustand store（localStorage 持久化）

### Agent 对话室
- [x] 流式输出稳定性修复：`leftover` 缓冲区解决跨 chunk 断行问题
- [x] `requestAnimationFrame` 批量合并 `setStreamingContent`，消除闪屏
- [x] `scrollToBottom` 移出循环热路径
- [x] ELN 暖色 UI：纸张底纹 / 白色 Agent 气泡 / 深绿用户气泡
- [x] 工具调用展示（左侧竖线便签卡片，running/done 状态）
- [x] 快捷提问 chips
- [x] 空状态引导 CTA

### 创意实验室（Lab）
- [x] 8 位投资人评审角色（DiceBear Lorelei 头像）
- [x] 章节过渡动画（全屏淡出遮罩）
- [x] 左侧投资人进度侧边栏
- [x] 评审卡片：Verdict 徽章 / 字段展示 / 字体分层
- [x] 综合方向 → 选择执行方向 → 跳转 Agent 对话
- [x] `resultsRef` 修复 `allDone` 的 stale closure bug

### 侧边栏（LeftSidebar）
- [x] ELN 暖色重绘
- [x] 品牌切换区（当前品牌 + 其他品牌列表 + 删除确认）
- [x] 鸣私聊入口（深绿 Avatar）
- [x] 话题对话列表（+ 新建 / 删除）
- [x] 底部导航：实验室 / 日历 / 数据分析 / 平台连接

### 右侧面板（RightPanel）
- [x] ELN 暖色重绘，三 Tab 标签
- [x] 内容输出 Tab：5 个按需生成入口，点击跳转聊天室并预填 prompt
- [x] 待办 Tab：本地增删改查，Zustand 持久化，完成划线动效
- [x] 知识库 Tab：读取真实 brand.knowledgeDocs，展开内容，显示品牌色板 / 调性 / 内容支柱

### 数据分析页
- [x] ELN 暖色重绘
- [x] 时间段切换（7天 / 30天 / 本月），各自独立数据集
- [x] 柱状图 CSS 动画
- [x] 从 store 读取真实帖子数量（草稿 / 排期 / 已发布）
- [x] AI 摘要卡片 + "让鸣生成周报"跳转

### 内容日历页
- [x] ELN 暖色重绘
- [x] 月份翻页
- [x] 读取 store 真实 posts 数据渲染到对应格子
- [x] 点击格子 → 右侧抽屉展示当日帖子
- [x] 帖子操作：复制内容 / 草稿→排期 / 排期→已发布
- [x] 空格子引导跳转聊天室

### 平台连接页（新建）
- [x] 12 个平台，国内 / 海外分组
- [x] Simple Icons CDN 真实平台 Logo
- [x] "标记关注"本地持久化（localStorage）
- [x] 账号名称填写，供鸣生成内容时参考
- [x] 每个平台展开"发布指南"：字数上限 / 最佳时间 / 频率 / 运营技巧

---

## 二、待开发（本地可实现，无需外部服务）

### P0 · 核心体验

- [ ] **`/app/[projectId]/page.tsx` 布局完善**  
  当前主对话页（非 thread 页）的 RightPanel 数据传递是否正确，需核查

- [ ] **Agent 工具实现**  
  `app/api/chat/route.ts` 里定义了工具（`get_trending_topics` / `generate_post` / `schedule_post` / `analyze_competitor` / `create_content_plan`），但目前都是 mock 返回。应改为：
  - `generate_post` → 真正调用 DeepSeek 生成内容后写入 `store.addPost()`
  - `schedule_post` → 写入 `store.addPost()` with `scheduledAt`
  - `analyze_competitor` → 调用 DeepSeek 生成竞品分析文字

- [ ] **Thread 标题自动更新**  
  新建 thread 默认标题是"新话题"，首条消息发出后应自动取前 8 字作为标题

- [ ] **Lab → Agent 的 prompt 注入**  
  Lab 选方向跳转时 `?lab_direction=xxx&lab_step=xxx`，Agent 读取并自动发送；目前有一个 `useEffect` 实现但可能和 React Strict Mode 下的双执行冲突，需加 `useRef` 防重发

- [ ] **`/app/[projectId]/lab/page.tsx` 页面**  
  当前 `app/app/[projectId]/lab/` 下有 page.tsx，但 Lab 的真实路由是 `/lab/[projectId]`，两处是否冲突需核查清理

### P1 · 功能完善

- [ ] **内容输出 Tab 自动填充**  
  Agent 调用 `generate_post` 工具成功后，将生成的内容卡片写入一个 store 新字段 `outputCards[]`，RightPanel "内容输出" Tab 展示，支持复制

- [ ] **待办与 Agent 联动**  
  Agent 调用 `schedule_post` 时，同时调用 `store.addTodo()` 生成"发布 XXX" 待办条目

- [ ] **数据分析页 — 基于真实 posts 的图表**  
  当前柱状图是纯 mock 数据，应统计 store 里帖子的 `createdAt` / `scheduledAt` 时间分布，生成真实趋势图

- [ ] **内容日历 — 拖拽调整排期**  
  帖子在日历格子间可拖拽，改变 `scheduledAt` 日期，写回 store

- [ ] **品牌档案编辑页**  
  `RightPanel` 知识库 Tab 里"更新品牌档案"目前跳 onboarding 重新创建，应有独立的品牌档案编辑页 `/app/[projectId]/settings`，支持直接修改 name / tone / colors / contentPillars 等

- [ ] **Onboarding — 真实网址解析**  
  目前是 mock 解析品牌信息，应接入真实爬虫或调用 AI 读取 URL 内容（需后端或 Playwright）

### P2 · 体验优化

- [ ] **移动端响应式**  
  当前布局 LeftSidebar(210px) + 主内容 + RightPanel(252px) 在窄屏不可用

- [ ] **Lab 评审重新进行**  
  进入已有项目的 Lab 时，应提供"重新评审"按钮，清空旧结果

- [ ] **消息搜索**  
  在 LeftSidebar 话题列表上方加搜索框，过滤 thread 标题或消息内容

- [ ] **键盘快捷键**  
  `Cmd+K` 打开指令面板；`Cmd+/` 聚焦输入框

---

## 三、需要外部服务（短期内不做）

| 功能 | 依赖 | 说明 |
|---|---|---|
| 品牌 Logo 上传并持久化 | 对象存储（OSS / S3） | base64 塞 localStorage 体积过大 |
| 平台 OAuth 真实连接 | 各平台开发者权限 + 后端 callback | 小红书/抖音国内平台审核周期长 |
| 一键发布内容到平台 | 平台 API + OAuth token | 依赖上一条 |
| 定时自动发布 | 服务端 Cron（Vercel Cron / Cloudflare Workers） | 前端无法持续运行 |
| 真实数据分析（粉丝 / 互动） | 各平台 Analytics API | 需 OAuth token |
| 品牌策略语音摘要 | TTS API（OpenAI TTS / ElevenLabs） | 需付费 API key |
| 网址真实解析 | 后端爬虫 或 Playwright | 受 CORS 限制，纯前端无法爬取 |
| **爆款拆解 + 内容参考库** | 第三方数据服务（飞瓜数据 / 蝉妈妈 / 新榜等） | 各平台无开放 API，自建爬虫有法律风险；需付费接入第三方数据服务后才可实现热榜抓取、点赞播放数据、AI 爆点分析、品牌对比改编等完整功能 |
| 用户账号系统 | Auth（Clerk / NextAuth / Supabase Auth） | 明确不做 |
| 多端数据同步 | 数据库（Supabase / PlanetScale） | 明确不做 |

---

## 四、技术债

- [ ] `LeftSidebar.tsx` 里有 `useMingStore.getState()` 直接调用（非 hook 形式），在 RSC 上下文可能出问题，应改为 prop 传入
- [ ] `AgentChatRoom.tsx` 的 `useEffect` 自动发送 Lab prompt 在 React Strict Mode 下可能双发，需 `useRef` 防重
- [ ] `app/app/[projectId]/lab/page.tsx` 与 `app/lab/[projectId]/page.tsx` 路由重复，需确认哪个是真实入口并清理
- [ ] `components/app/chat/MessageBubble.tsx` / `QuickActions.tsx` / `ToolCallCard.tsx` 是否还在使用，若已被 AgentChatRoom 内联替代则可删除

---

*最后更新：2026-06-26*

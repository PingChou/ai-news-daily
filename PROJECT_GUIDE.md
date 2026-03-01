# AI News Daily - 项目说明文档

## 项目概述

AI News Daily 是一个 AI 新闻聚合与处理平台，自动从多个 RSS 源抓取 AI 行业动态，使用 LLM 生成多语言、多难度层次的摘要，为不同类型的读者提供个性化的阅读体验。

### 主要功能

| 功能 | 描述 |
|------|------|
| RSS 聚合 | 从 8+ 个 AI 相关 RSS 源自动抓取最新文章 |
| AI 摘要 | 使用 LLM 自动生成文章摘要和标签 |
| 多语言支持 | 中英双语界面，自动翻译标题和摘要 |
| 多层次摘要 | 提供三种摘要：核心摘要、简明版（大众）、深度版（开发者） |
| 难度分级 | 自动评估文章难度：入门/通用/进阶 |
| 标签分类 | AI 自动生成标签，支持按标签筛选 |
| 深色模式 | 支持明暗主题切换 |

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| 前端 | React 19, TypeScript |
| 样式 | Tailwind CSS 4 |
| 数据库 | PostgreSQL (Supabase) |
| ORM | Prisma |
| RSS 解析 | rss-parser |
| LLM | OpenAI / Anthropic / 智谱 GLM |
| 日期处理 | date-fns |

---

## 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户界面层                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Header    │  │  ClientPage │  │ ArticleCard │              │
│  │ (语言/主题) │  │  (筛选逻辑) │  │  (文章展示) │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         服务端渲染层                             │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                     page.tsx                             │    │
│  │  • 获取已处理文章列表                                      │    │
│  │  • 获取热门标签                                           │    │
│  │  • 序列化数据传递给客户端                                   │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          API 层                                 │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │  /api/fetch      │  │  /api/articles   │                    │
│  │  GET: 抓取文章   │  │  GET: 文章列表   │                    │
│  │  POST: AI处理   │  │  支持分页/筛选   │                    │
│  └──────────────────┘  └──────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        核心业务层                               │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                │
│  │ sources.ts │  │ fetcher.ts │  │summarizer.ts│               │
│  │ RSS源配置  │→│ 抓取&存储  │→│ LLM处理    │                │
│  └────────────┘  └────────────┘  └────────────┘                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        数据持久层                               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Prisma ORM → PostgreSQL                    │    │
│  │         Source / Article / Tag / ArticleTag             │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 数据流

```
RSS 源配置                    LLM 处理
    │                            │
    ▼                            ▼
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ RSS源   │───→│ 抓取文章 │───→│ 存入DB  │───→│ 生成摘要 │
│ 配置表  │    │ (fetcher)│   │(pending)│    │(summarizer)│
└─────────┘    └─────────┘    └─────────┘    └─────────┘
                                                  │
                                                  ▼
                                             ┌─────────┐
                                             │ 更新DB  │
                                             │(processed)│
                                             └─────────┘
                                                  │
                                                  ▼
                                             ┌─────────┐
                                             │ 前端展示 │
                                             └─────────┘
```

### 文章状态流转

```
pending → processed → featured
  │          │          │
  │          │          └── 精选推荐（预留）
  │          └── 已完成 AI 处理，可展示
  └── 刚抓取，等待处理
```

---

## 目录结构

```
src/
├── app/                      # Next.js App Router
│   ├── api/
│   │   ├── fetch/route.ts    # 抓取 & AI 处理 API
│   │   └── articles/route.ts # 文章列表 API
│   ├── page.tsx              # 首页（服务端组件）
│   ├── layout.tsx            # 根布局
│   └── globals.css           # 全局样式
│
├── components/               # React 组件
│   ├── ClientPage.tsx        # 客户端主页面（筛选逻辑）
│   ├── Header.tsx            # 顶部导航（语言/主题切换）
│   ├── ArticleCard.tsx       # 文章卡片（服务端用）
│   └── TagFilter.tsx         # 标签筛选器
│
└── lib/                      # 核心业务逻辑
    ├── sources.ts            # RSS 源配置
    ├── fetcher.ts            # RSS 抓取 & 存储
    ├── summarizer.ts         # LLM 摘要生成
    ├── db.ts                 # Prisma 客户端
    └── seed.ts               # 测试数据填充

prisma/
├── schema.prisma             # 数据库 Schema
├── schema.postgres.prisma    # PostgreSQL 专用 Schema
└── migrations/               # 数据库迁移记录
```

---

## 核心模块详解

### 1. sources.ts - RSS 源配置

定义所有 RSS 数据源，包括官方博客、科技媒体、学术资源：

```typescript
export const RSS_SOURCES = [
  { name: "OpenAI Blog", url: "...", category: "blog" },
  { name: "MIT Technology Review", url: "...", category: "news" },
  { name: "Hugging Face Blog", url: "...", category: "paper" },
  // ...
];
```

**扩展新数据源**：在 `RSS_SOURCES` 数组中添加配置即可。

### 2. fetcher.ts - 文章抓取

| 函数 | 功能 |
|------|------|
| `fetchFromSource()` | 从单个 RSS 源抓取文章 |
| `fetchAllSources()` | 并行抓取所有源 |
| `saveArticles()` | 保存到数据库，去重处理 |
| `runFetcher()` | 主入口：抓取 + 存储 |

**关键特性**：
- 自动提取文章图片
- 基于原链接 URL 去重
- 超时控制（10秒）

### 3. summarizer.ts - LLM 摘要生成

| 函数 | 功能 |
|------|------|
| `summarizeArticle()` | 单篇文章摘要生成 |
| `processPendingArticles()` | 批量处理待处理文章 |
| `callOpenAI()` | 调用 OpenAI / 智谱 API |
| `callAnthropic()` | 调用 Claude API |

**生成的字段**：
| 字段 | 中文 | 英文 |
|------|------|------|
| 标题 | titleZh | titleEn |
| 核心摘要 | summary | summaryEn |
| 简明版 | summarySimple | summarySimpleEn |
| 深度版 | summaryDeep | summaryDeepEn |

**Prompt 设计要点**：
- 自动识别原文语言
- 根据内容评估难度等级
- 生成 3 个相关标签

### 4. db.ts - 数据库连接

Prisma 客户端单例模式，避免开发环境热重载时创建多个连接。

---

## 数据库 Schema

```prisma
// 数据源
model Source {
  id        String    @id @default(cuid())
  name      String    // 来源名称
  type      String    // rss | api | custom
  url       String    // RSS链接或API地址
  category  String    // news | paper | blog
  active    Boolean   @default(true)
  articles  Article[]
}

// 文章
model Article {
  id            String   @id @default(cuid())
  title         String              // 原始标题
  titleEn       String?             // 英文标题
  titleZh       String?             // 中文标题
  originalUrl   String   @unique    // 原文链接（唯一）
  sourceId      String
  source        Source   @relation(...)
  publishedAt   DateTime            // 原始发布时间
  fetchedAt     DateTime @default(now())

  // AI 生成内容 - 中文
  summary       String?  // 核心摘要
  summarySimple String?  // 简明版
  summaryDeep   String?  // 深度版

  // AI 生成内容 - 英文
  summaryEn       String?
  summarySimpleEn String?
  summaryDeepEn   String?

  difficulty    String?  @default("general") // beginner | general | advanced
  lang          String?  @default("en")      // 原文语言
  imageUrl      String?
  tags          ArticleTag[]
  status        String   @default("pending") // pending | processed | featured
}

// 标签
model Tag {
  id        String        @id @default(cuid())
  name      String        @unique
  articles  ArticleTag[]
}

// 文章-标签关联（多对多）
model ArticleTag {
  articleId String
  tagId     String
  article   Article @relation(...)
  tag       Tag     @relation(...)
  @@id([articleId, tagId])
}
```

---

## API 接口

### GET /api/fetch
抓取新的 RSS 文章

**请求头**：
```
Authorization: Bearer <CRON_SECRET>
```

**响应**：
```json
{
  "success": true,
  "saved": 15,
  "skipped": 42
}
```

### POST /api/fetch
触发 AI 处理待处理文章

**请求头**：
```
Authorization: Bearer <CRON_SECRET>
Content-Type: application/json
```

**请求体**：
```json
{
  "batchSize": 10
}
```

**响应**：
```json
{
  "success": true,
  "processed": 10,
  "failed": 0
}
```

### GET /api/articles
获取文章列表

**查询参数**：
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | int | 1 | 页码 |
| limit | int | 20 | 每页数量 |
| status | string | processed | 文章状态 |
| difficulty | string | - | 难度筛选 |
| tag | string | - | 标签筛选 |

**响应**：
```json
{
  "articles": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## 前端组件

### 组件关系

```
page.tsx (Server Component)
    │
    ├── prisma.article.findMany()
    ├── prisma.tag.findMany()
    │
    └── ClientPage (Client Component)
            │
            ├── Header (语言/主题切换)
            ├── FilterButton (难度筛选)
            ├── TagButton (标签筛选)
            └── ArticleCardClient (文章卡片)
```

### ClientPage.tsx - 主页面逻辑

**状态管理**：
```typescript
const [difficulty, setDifficulty] = useState<string | null>(null);
const [selectedTag, setSelectedTag] = useState<string | null>(null);
const [lang, setLang] = useState<Language>("zh");
```

**筛选逻辑**：
```typescript
const filteredArticles = useMemo(() => {
  return initialArticles.filter((article) => {
    if (difficulty && article.difficulty !== difficulty) return false;
    if (selectedTag && !article.tags.includes(selectedTag)) return false;
    return true;
  });
}, [initialArticles, difficulty, selectedTag]);
```

**多语言显示**：
- 中文模式：优先显示 titleZh/summarySimple，回退到原始内容
- 英文模式：优先显示 titleEn/summarySimpleEn，回退到原始内容

### Header.tsx - 顶部导航

- 语言切换：中/英，保存到 localStorage
- 主题切换：明/暗，保存到 localStorage

---

## 环境配置

### .env 文件

```bash
# Supabase PostgreSQL
DATABASE_URL="postgresql://..."   # 连接池地址（应用使用）
DIRECT_URL="postgresql://..."     # 直连地址（迁移使用）

# LLM 配置
LLM_PROVIDER="openai"             # openai | anthropic
LLM_API_KEY="your-api-key"
LLM_MODEL="gpt-4o-mini"           # 或 glm-5, claude-3-haiku-20240307

# API 认证
CRON_SECRET="your-random-secret"  # 定时任务调用密钥
```

### LLM 提供商配置

| 提供商 | LLM_PROVIDER | LLM_MODEL 示例 |
|--------|--------------|----------------|
| OpenAI | openai | gpt-4o-mini, gpt-4o |
| 智谱 AI | openai | glm-5, glm-4 |
| Anthropic | anthropic | claude-3-haiku-20240307 |

**注意**：智谱 AI 通过 OpenAI 兼容接口调用，代码会自动检测模型名包含 "glm" 时切换到智谱端点。

---

## 开发指南

### 本地开发

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入实际配置

# 初始化数据库
npx prisma db push

# 填充测试数据（可选）
npx ts-node src/lib/seed.ts

# 启动开发服务器
npm run dev
```

### 常用命令

```bash
# 开发
npm run dev              # 启动开发服务器
npm run lint             # 代码检查

# 数据库
npx prisma studio        # 打开数据库 GUI
npx prisma db push       # 推送 schema 变更
npx prisma migrate dev   # 创建迁移

# 测试
npx ts-node src/lib/seed.ts  # 填充测试数据
```

### 手动触发抓取和处理

```bash
# 抓取新文章
curl http://localhost:3000/api/fetch

# 触发 AI 处理
curl -X POST http://localhost:3000/api/fetch \
  -H "Content-Type: application/json" \
  -d '{"batchSize": 10}'
```

---

## 部署说明

### Vercel 部署（推荐）

1. 连接 GitHub 仓库到 Vercel
2. 配置环境变量（DATABASE_URL, LLM_API_KEY 等）
3. 部署完成后配置定时任务：
   - 定时调用 `GET /api/fetch` 抓取文章
   - 定时调用 `POST /api/fetch` 处理文章

### 定时任务配置

使用 Vercel Cron Jobs 或外部服务（如 cron-job.org）：

```
# 每小时抓取一次
0 * * * * GET /api/fetch

# 每 30 分钟处理一批
*/30 * * * * POST /api/fetch {"batchSize": 5}
```

---

## 扩展指南

### 添加新的 RSS 源

编辑 `src/lib/sources.ts`：

```typescript
export const RSS_SOURCES = [
  // 添加新源
  {
    name: "新数据源名称",
    url: "https://example.com/rss.xml",
    category: "news", // news | blog | paper
  },
];
```

### 添加新的 LLM 提供商

编辑 `src/lib/summarizer.ts`：

1. 更新 `LLM_CONFIG` 类型
2. 添加新的调用函数（如 `callNewProvider()`）
3. 在 `summarizeArticle()` 中添加分支

### 自定义摘要 Prompt

编辑 `src/lib/summarizer.ts` 中的 `prompt` 变量，调整：
- 摘要长度要求
- 标签生成规则
- 难度评估标准

---

## 常见问题

### Q: 为什么文章没有摘要？
A: 检查 LLM_API_KEY 是否正确配置。未配置时会显示占位文本。

### Q: 如何修改摘要的 Prompt？
A: 编辑 `src/lib/summarizer.ts` 中的 `prompt` 变量。

### Q: 数据库连接失败？
A: 确保 DATABASE_URL 和 DIRECT_URL 配置正确，Supabase 项目未暂停。

### Q: 如何清空数据库重新开始？
A:
```bash
npx prisma migrate reset  # 会删除所有数据
npx ts-node src/lib/seed.ts  # 重新填充测试数据
```

import { prisma } from "./db";

async function seed() {
  // 创建数据源
  const source = await prisma.source.upsert({
    where: { id: "test-source" },
    create: {
      id: "test-source",
      name: "AI News Test",
      type: "rss",
      url: "https://example.com/rss",
      category: "news",
    },
    update: {},
  });

  // 创建标签
  const tags = await Promise.all(
    ["大语言模型", "计算机视觉", "AI应用", "开源模型", "研究突破"].map(
      (name) =>
        prisma.tag.upsert({
          where: { name },
          create: { name },
          update: {},
        })
    )
  );

  // 创建测试文章
  const articles = [
    {
      title: "OpenAI 发布 GPT-5，性能提升显著",
      originalUrl: "https://example.com/1",
      summary: "OpenAI 今日发布了新一代大语言模型 GPT-5，在推理能力、多模态理解等方面有显著提升。",
      summarySimple: "OpenAI 新发布的 GPT-5 更聪明了，能更好地理解和回答问题。",
      summaryDeep:
        "GPT-5 采用了全新的架构设计，参数量达到万亿级别，在 MMLU 测试中得分 95%，相比 GPT-4 提升了 15 个百分点。支持更长的上下文窗口和更精准的多模态理解。",
      difficulty: "general",
    },
    {
      title: "Claude 4 发布：Anthropic 的最新力作",
      originalUrl: "https://example.com/2",
      summary: "Anthropic 发布 Claude 4，在安全性和有用性方面取得新突破。",
      summarySimple: "Claude 4 来了，更安全也更有用。",
      summaryDeep:
        "Claude 4 引入了新的宪法 AI 机制，在保持高安全标准的同时提升了任务完成能力。支持 200K 上下文窗口，在代码生成任务中表现优异。",
      difficulty: "advanced",
    },
    {
      title: "AI 绘图入门：如何使用 Midjourney",
      originalUrl: "https://example.com/3",
      summary: "本文介绍 AI 绘图工具 Midjourney 的基础使用方法，适合新手入门。",
      summarySimple: "想用 AI 画图？这篇教程手把手教你用 Midjourney。",
      summaryDeep:
        "详细介绍了 Midjourney 的 prompt 语法、参数设置、风格控制等高级技巧，以及如何通过迭代优化获得理想效果。",
      difficulty: "beginner",
    },
    {
      title: "Meta 开源 Llama 4 模型",
      originalUrl: "https://example.com/4",
      summary: "Meta 继续推进 AI 开源战略，发布 Llama 4 系列模型。",
      summarySimple: "Meta 又开源新模型了，Llama 4 免费可用。",
      summaryDeep:
        "Llama 4 提供 7B、13B、70B 三种规格，采用 MoE 架构，在保持高效推理的同时大幅提升模型能力。已支持 Hugging Face Transformers。",
      difficulty: "general",
    },
    {
      title: "Google DeepMind 最新研究：AI 解决数学难题",
      originalUrl: "https://example.com/5",
      summary: "DeepMind 的 AlphaProof 系统在国际数学奥林匹克竞赛中达到银牌水平。",
      summarySimple: "AI 现在做数学题能达到奥赛银牌水平了。",
      summaryDeep:
        "AlphaProof 结合了形式化证明和神经网络方法，在 IMO 2024 的六道题目中正确解答了四道。这一突破展示了 AI 在复杂推理任务上的潜力。",
      difficulty: "advanced",
    },
  ];

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    await prisma.article.upsert({
      where: { originalUrl: article.originalUrl },
      create: {
        ...article,
        sourceId: source.id,
        publishedAt: new Date(Date.now() - i * 3600000),
        status: "processed",
        tags: {
          create: tags.slice(0, 3).map((tag) => ({ tagId: tag.id })),
        },
      },
      update: {},
    });
  }

  console.log("Seed completed!");
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

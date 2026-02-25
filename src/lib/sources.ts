// AI 新闻数据源配置
export const RSS_SOURCES = [
  // 官方博客
  {
    name: "OpenAI Blog",
    url: "https://openai.com/blog/rss.xml",
    category: "blog",
  },
  {
    name: "Google DeepMind",
    url: "https://deepmind.google/discover/blog/",
    category: "blog",
  },
  {
    name: "Anthropic News",
    url: "https://www.anthropic.com/news",
    category: "blog",
  },
  // 科技媒体
  {
    name: "MIT Technology Review - AI",
    url: "https://www.technologyreview.com/feed/",
    category: "news",
  },
  {
    name: "The Verge - AI",
    url: "https://www.theverge.com/ai-artificial-intelligence/rss/index.xml",
    category: "news",
  },
  {
    name: "VentureBeat AI",
    url: "https://venturebeat.com/category/ai/feed/",
    category: "news",
  },
  // 学术
  {
    name: "Hugging Face Blog",
    url: "https://huggingface.co/blog/feed.xml",
    category: "paper",
  },
  {
    name: "Distill",
    url: "https://distill.pub/rss.xml",
    category: "paper",
  },
];

// 默认标签
export const DEFAULT_TAGS = [
  "大语言模型",
  "计算机视觉",
  "强化学习",
  "多模态",
  "开源模型",
  "AI应用",
  "行业动态",
  "研究突破",
  "工具发布",
  "政策法规",
];

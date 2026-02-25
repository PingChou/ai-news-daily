import Parser from "rss-parser";
import { prisma } from "./db";
import { RSS_SOURCES } from "./sources";

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "AI-News-Daily/1.0",
  },
});

export interface FetchedArticle {
  title: string;
  url: string;
  publishedAt: Date;
  content?: string;
  summary?: string;
  imageUrl?: string;
  sourceName: string;
}

// 从单个 RSS 源抓取文章
async function fetchFromSource(
  source: (typeof RSS_SOURCES)[number]
): Promise<FetchedArticle[]> {
  try {
    const feed = await parser.parseURL(source.url);

    return feed.items.slice(0, 20).map((item) => ({
      title: item.title || "Untitled",
      url: item.link || "",
      publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
      content: item.contentSnippet || item.content || "",
      summary: item.contentSnippet?.slice(0, 300),
      imageUrl: item.enclosure?.url || extractImage(item.content),
      sourceName: source.name,
    }));
  } catch (error) {
    console.error(`Failed to fetch from ${source.name}:`, error);
    return [];
  }
}

// 从 HTML 内容中提取图片
function extractImage(html?: string): string | undefined {
  if (!html) return undefined;
  const match = html.match(/<img[^>]+src="([^">]+)"/);
  return match?.[1];
}

// 抓取所有源的文章
export async function fetchAllSources(): Promise<FetchedArticle[]> {
  const results = await Promise.all(RSS_SOURCES.map(fetchFromSource));
  return results.flat();
}

// 保存文章到数据库
export async function saveArticles(articles: FetchedArticle[]) {
  let saved = 0;
  let skipped = 0;

  // 获取或创建数据源
  const sourceMap = new Map<string, string>();
  for (const src of RSS_SOURCES) {
    const existing = await prisma.source.findFirst({
      where: { name: src.name },
    });
    if (existing) {
      sourceMap.set(src.name, existing.id);
    } else {
      const created = await prisma.source.create({
        data: {
          name: src.name,
          type: "rss",
          url: src.url,
          category: src.category,
        },
      });
      sourceMap.set(src.name, created.id);
    }
  }

  for (const article of articles) {
    try {
      // 检查是否已存在
      const existing = await prisma.article.findUnique({
        where: { originalUrl: article.url },
      });

      if (existing) {
        skipped++;
        continue;
      }

      const sourceId = sourceMap.get(article.sourceName);
      if (!sourceId) continue;

      await prisma.article.create({
        data: {
          title: article.title,
          originalUrl: article.url,
          sourceId,
          publishedAt: article.publishedAt,
          summary: article.summary,
          imageUrl: article.imageUrl,
          status: "pending",
        },
      });
      saved++;
    } catch (error) {
      console.error(`Failed to save article: ${article.title}`, error);
    }
  }

  return { saved, skipped };
}

// 主抓取函数
export async function runFetcher() {
  console.log("Starting to fetch articles...");
  const articles = await fetchAllSources();
  console.log(`Fetched ${articles.length} articles`);

  const result = await saveArticles(articles);
  console.log(`Saved ${result.saved} new articles, skipped ${result.skipped}`);

  return result;
}

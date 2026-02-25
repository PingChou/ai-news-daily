import { prisma } from "@/lib/db";
import { ClientPage } from "@/components/ClientPage";

export default async function Home() {
  // 获取所有文章和标签（包括待处理的）
  const [articles, tags] = await Promise.all([
    prisma.article.findMany({
      where: {
        OR: [
          { status: "processed" },
          { status: "pending" }
        ]
      },
      take: 50,
      orderBy: { publishedAt: "desc" },
      include: {
        source: { select: { name: true, category: true } },
        tags: { include: { tag: { select: { name: true } } } },
      },
    }),
    prisma.tag.findMany({
      include: {
        _count: { select: { articles: true } },
      },
      orderBy: { articles: { _count: "desc" } },
      take: 15,
    }),
  ]);

  // 序列化数据给客户端
  const serializedArticles = articles.map((a) => ({
    id: a.id,
    title: a.title,
    titleZh: a.titleZh,
    titleEn: a.titleEn,
    originalUrl: a.originalUrl,
    publishedAt: a.publishedAt.toISOString(),
    summary: a.summary,
    summarySimple: a.summarySimple,
    summaryDeep: a.summaryDeep,
    summaryEn: a.summaryEn,
    summarySimpleEn: a.summarySimpleEn,
    summaryDeepEn: a.summaryDeepEn,
    difficulty: a.difficulty,
    imageUrl: a.imageUrl,
    source: a.source,
    tags: a.tags.map((t) => t.tag.name),
    lang: a.lang,
  }));

  const serializedTags = tags.map((t) => ({
    id: t.id,
    name: t.name,
    count: t._count.articles,
  }));

  return (
    <ClientPage
      initialArticles={serializedArticles}
      tags={serializedTags}
    />
  );
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET: 获取文章列表
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const difficulty = searchParams.get("difficulty");
  const tag = searchParams.get("tag");
  const status = searchParams.get("status") || "processed";

  const skip = (page - 1) * limit;

  try {
    const where: Record<string, unknown> = { status };

    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (tag) {
      where.tags = {
        some: {
          tag: {
            name: tag,
          },
        },
      };
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        skip,
        take: limit,
        orderBy: { publishedAt: "desc" },
        include: {
          source: {
            select: { name: true, category: true },
          },
          tags: {
            include: {
              tag: { select: { name: true } },
            },
          },
        },
      }),
      prisma.article.count({ where }),
    ]);

    return NextResponse.json({
      articles: articles.map((a) => ({
        id: a.id,
        title: a.title,
        originalUrl: a.originalUrl,
        publishedAt: a.publishedAt,
        summary: a.summary,
        summarySimple: a.summarySimple,
        summaryDeep: a.summaryDeep,
        difficulty: a.difficulty,
        imageUrl: a.imageUrl,
        source: a.source,
        tags: a.tags.map((t) => t.tag.name),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { runFetcher, saveArticles, fetchAllSources } from "@/lib/fetcher";
import { processPendingArticles } from "@/lib/summarizer";

// 简单的 API 密钥验证
function validateAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // 如果没有配置密钥，允许本地开发
  if (!cronSecret) return true;

  return authHeader === `Bearer ${cronSecret}`;
}

// GET: 抓取新文章
export async function GET(request: NextRequest) {
  if (!validateAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runFetcher();
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}

// POST: 触发 AI 处理
export async function POST(request: NextRequest) {
  if (!validateAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const batchSize = body.batchSize || 10;

    const result = await processPendingArticles(batchSize);
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Process error:", error);
    return NextResponse.json(
      { error: "Failed to process articles" },
      { status: 500 }
    );
  }
}

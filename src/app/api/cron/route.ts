import { NextRequest, NextResponse } from "next/server";
import { runFetcher } from "@/lib/fetcher";
import { processPendingArticles } from "@/lib/summarizer";

// 验证请求来源
function validateAuth(request: NextRequest): boolean {
  // 1. 检查 Authorization header
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // 2. 检查 Vercel Cron 的内置 header (Pro 计划)
  const authSignal = request.headers.get("x-vercel-cron-secret");
  if (authSignal) {
    return true;
  }

  // 3. 本地开发时允许
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  return false;
}

// GET: 仅抓取新文章
export async function GET(request: NextRequest) {
  if (!validateAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runFetcher();
    console.log(`[Cron] Fetch completed: ${result.saved} saved, ${result.skipped} skipped`);
    return NextResponse.json({
      success: true,
      action: "fetch",
      ...result,
    });
  } catch (error) {
    console.error("[Cron] Fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles", details: String(error) },
      { status: 500 }
    );
  }
}

// POST: 抓取 + 处理（一站式）
export async function POST(request: NextRequest) {
  if (!validateAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const batchSize = body.batchSize || 5;

    // Step 1: 抓取新文章
    const fetchResult = await runFetcher();
    console.log(`[Cron] Fetch: ${fetchResult.saved} saved, ${fetchResult.skipped} skipped`);

    // Step 2: 处理待处理文章
    const processResult = await processPendingArticles(batchSize);
    console.log(`[Cron] Process: ${processResult.processed} processed, ${processResult.failed} failed`);

    return NextResponse.json({
      success: true,
      action: "fetch-and-process",
      fetch: fetchResult,
      process: processResult,
    });
  } catch (error) {
    console.error("[Cron] Error:", error);
    return NextResponse.json(
      { error: "Cron job failed", details: String(error) },
      { status: 500 }
    );
  }
}

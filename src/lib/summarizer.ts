import { prisma } from './db'

// LLM 配置 - 支持 OpenAI 和 Anthropic
const LLM_CONFIG = {
  provider: (process.env.LLM_PROVIDER || 'openai') as 'openai' | 'anthropic',
  apiKey: process.env.LLM_API_KEY || '',
  model: process.env.LLM_MODEL || 'gpt-4o-mini',
}

interface SummarizeResult {
  // 中文
  titleZh: string
  summary: string
  summarySimple: string
  summaryDeep: string
  // 英文
  titleEn: string
  summaryEn: string
  summarySimpleEn: string
  summaryDeepEn: string
  // 其他
  difficulty: 'beginner' | 'general' | 'advanced'
  tags: string[]
  lang: 'en' | 'zh'
}

// 使用 LLM 生成摘要和分类
export async function summarizeArticle(
  title: string,
  content: string,
): Promise<SummarizeResult> {
  // 如果没有配置 API Key，返回默认值
  if (!LLM_CONFIG.apiKey) {
    return {
      titleZh: title,
      titleEn: title,
      summary: content.slice(0, 200) + '...',
      summarySimple: '暂无摘要，请配置 LLM API Key',
      summaryDeep: '暂无深度解读，请配置 LLM API Key',
      summaryEn: content.slice(0, 200) + '...',
      summarySimpleEn: 'No summary available. Please configure LLM API Key.',
      summaryDeepEn: 'No deep analysis available. Please configure LLM API Key.',
      difficulty: 'general',
      tags: [],
      lang: 'en',
    }
  }

  const prompt = `You are an AI news editor. Analyze the following article and generate bilingual (Chinese and English) summaries.

Article Title: ${title}

Article Content:
${content.slice(0, 3000)}

Please return a JSON object with the following fields:
{
  "lang": "en" or "zh" (the original language of the article),
  "titleZh": "Chinese translation of the title",
  "titleEn": "English translation of the title",
  "summary": "100字以内的核心摘要（中文）",
  "summarySimple": "用通俗易懂的语言，给普通读者看的50字简介（中文）",
  "summaryDeep": "给开发者看的200字技术解读，包含技术细节和影响分析（中文）",
  "summaryEn": "Core summary within 100 words (English)",
  "summarySimpleEn": "Simple 50-word introduction for general readers (English)",
  "summaryDeepEn": "200-word technical analysis for developers (English)",
  "difficulty": "beginner" or "general" or "advanced",
  "tags": ["tag1", "tag2", "tag3"] (Chinese tags)
}

Return ONLY the JSON object, no other content.`

  try {
    let response: string

    if (LLM_CONFIG.provider === 'openai') {
      response = await callOpenAI(prompt)
    } else {
      response = await callAnthropic(prompt)
    }

    // 清理 markdown 代码块标记
    let cleanedResponse = response.trim()
    if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }

    // 解析 JSON 响应
    const result = JSON.parse(cleanedResponse)
    return {
      titleZh: result.titleZh || title,
      titleEn: result.titleEn || title,
      summary: result.summary || '',
      summarySimple: result.summarySimple || '',
      summaryDeep: result.summaryDeep || '',
      summaryEn: result.summaryEn || '',
      summarySimpleEn: result.summarySimpleEn || '',
      summaryDeepEn: result.summaryDeepEn || '',
      difficulty: result.difficulty || 'general',
      tags: result.tags || [],
      lang: result.lang || 'en',
    }
  } catch (error) {
    console.error('Failed to summarize article:', error)
    return {
      titleZh: title,
      titleEn: title,
      summary: content.slice(0, 200),
      summarySimple: '',
      summaryDeep: '',
      summaryEn: content.slice(0, 200),
      summarySimpleEn: '',
      summaryDeepEn: '',
      difficulty: 'general',
      tags: [],
      lang: 'en',
    }
  }
}

async function callOpenAI(prompt: string): Promise<string> {
  // 支持智谱 AI (GLM) 和 OpenAI
  const isZhipu = LLM_CONFIG.model.includes('glm')
  const baseUrl = isZhipu
    ? 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
    : 'https://api.openai.com/v1/chat/completions'

  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LLM_CONFIG.apiKey}`,
    },
    body: JSON.stringify({
      model: LLM_CONFIG.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  })

  const data = await res.json()

  // 检查 API 错误
  if (!res.ok) {
    throw new Error(`LLM API error (${res.status}): ${JSON.stringify(data)}`)
  }

  // 检查返回数据结构
  if (!data.choices?.[0]?.message?.content) {
    throw new Error(`Invalid LLM response: ${JSON.stringify(data)}`)
  }

  return data.choices[0].message.content
}

async function callAnthropic(prompt: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': LLM_CONFIG.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: LLM_CONFIG.model,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const data = await res.json()

  // 检查 API 错误
  if (!res.ok) {
    throw new Error(`Anthropic API error (${res.status}): ${JSON.stringify(data)}`)
  }

  // 检查返回数据结构
  if (!data.content?.[0]?.text) {
    throw new Error(`Invalid Anthropic response: ${JSON.stringify(data)}`)
  }

  return data.content[0].text
}

// 批量处理待处理文章
export async function processPendingArticles(batchSize = 10) {
  const pending = await prisma.article.findMany({
    where: { status: 'pending' },
    take: batchSize,
    include: { source: true },
  })

  let processed = 0
  let failed = 0

  for (const article of pending) {
    try {
      const content = article.summary || article.title
      const result = await summarizeArticle(article.title, content)

      // 创建或获取标签
      const tagConnections = []
      for (const tagName of result.tags) {
        const tag = await prisma.tag.upsert({
          where: { name: tagName },
          create: { name: tagName },
          update: {},
        })
        tagConnections.push({ tagId: tag.id })
      }

      // 更新文章
      await prisma.article.update({
        where: { id: article.id },
        data: {
          titleZh: result.titleZh,
          titleEn: result.titleEn,
          summary: result.summary,
          summarySimple: result.summarySimple,
          summaryDeep: result.summaryDeep,
          summaryEn: result.summaryEn,
          summarySimpleEn: result.summarySimpleEn,
          summaryDeepEn: result.summaryDeepEn,
          difficulty: result.difficulty,
          lang: result.lang,
          status: 'processed',
          tags: {
            deleteMany: {},
            create: tagConnections,
          },
        },
      })

      processed++
    } catch (error) {
      console.error(`Failed to process article ${article.id}:`, error)
      failed++
    }
  }

  return { processed, failed }
}

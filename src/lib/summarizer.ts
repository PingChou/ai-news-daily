import { prisma } from './db'

// LLM 配置 - 支持 OpenAI 和 Anthropic
const LLM_CONFIG = {
  provider: (process.env.LLM_PROVIDER || 'openai') as 'openai' | 'anthropic',
  apiKey: process.env.LLM_API_KEY || '',
  model: process.env.LLM_MODEL || 'gpt-4o-mini',
}

// 修复不规范的 JSON 字符串
function repairJson(str: string): string {
  // 1. 移除控制字符
  str = str.replace(/[\x00-\x1F\x7F]/g, (char) => {
    if (char === '\n') return '\\n'
    if (char === '\r') return '\\r'
    if (char === '\t') return '\\t'
    return ''
  })

  // 2. 修复未转义的引号（在字符串值内部）
  // 这个正则尝试修复 "key": "value with "quotes" inside" 的情况
  str = str.replace(/"([^"]+)":\s*"([^"]*)(")([^"]*)(")/g, '"$1": "$2\\"$4$5"')

  // 3. 修复未终止的字符串（在末尾添加引号）
  // 查找最后一个未闭合的引号
  const quoteCount = (str.match(/(?<!\\)"/g) || []).length
  if (quoteCount % 2 !== 0) {
    str = str + '"'
  }

  // 4. 修复未闭合的括号
  const openBraces = (str.match(/{/g) || []).length
  const closeBraces = (str.match(/}/g) || []).length
  if (openBraces > closeBraces) {
    str = str + '}'.repeat(openBraces - closeBraces)
  }

  const openBrackets = (str.match(/\[/g) || []).length
  const closeBrackets = (str.match(/]/g) || []).length
  if (openBrackets > closeBrackets) {
    str = str + ']'.repeat(openBrackets - closeBrackets)
  }

  return str
}

// 安全解析 JSON，带修复尝试
function safeParseJson(str: string): Record<string, unknown> | null {
  // 首先尝试直接解析
  try {
    return JSON.parse(str)
  } catch {
    // 忽略，继续尝试修复
  }

  // 尝试修复后解析
  try {
    const repaired = repairJson(str)
    return JSON.parse(repaired)
  } catch {
    // 忽略，继续尝试其他方法
  }

  // 尝试提取各个字段的值
  try {
    const result: Record<string, unknown> = {}

    // 提取字符串字段
    const stringFields = ['lang', 'titleZh', 'titleEn', 'summary', 'summarySimple', 'summaryDeep', 'summaryEn', 'summarySimpleEn', 'summaryDeepEn', 'difficulty']
    for (const field of stringFields) {
      const match = str.match(new RegExp(`"${field}"\\s*:\\s*"([^"]*(?:\\.[^"]*)*)"`, 's'))
      if (match) {
        result[field] = match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"')
      }
    }

    // 提取 tags 数组
    const tagsMatch = str.match(/"tags"\s*:\s*\[([\s\S]*?)\]/)
    if (tagsMatch) {
      const tagsStr = tagsMatch[1]
      const tags = tagsStr.match(/"([^"]+)"/g)?.map(t => t.slice(1, -1)) || []
      result.tags = tags
    }

    if (Object.keys(result).length > 0) {
      return result
    }
  } catch {
    // 忽略
  }

  return null
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

  const prompt = `分析以下 AI 新闻文章，生成双语摘要。请严格按照 JSON 格式返回，不要添加任何额外文字。

文章标题: ${title}

文章内容:
${content.slice(0, 2000)}

请返回以下 JSON 格式（确保 JSON 语法正确，所有字符串用双引号包裹）:
{"lang":"en或zh","titleZh":"中文标题","titleEn":"英文标题","summary":"100字内中文核心摘要","summarySimple":"50字通俗易懂简介","summaryDeep":"200字技术解读","summaryEn":"English summary","summarySimpleEn":"Simple intro","summaryDeepEn":"Technical analysis","difficulty":"beginner或general或advanced","tags":["标签1","标签2"]}

只返回 JSON，不要其他内容。`

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

    // 尝试提取 JSON 对象（处理模型返回多余内容的情况）
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0]
    }

    // 使用安全解析函数
    const result = safeParseJson(cleanedResponse)
    if (!result) {
      console.error('[LLM] Failed to parse JSON after repair attempts:', cleanedResponse.slice(0, 500))
      throw new Error('Failed to parse LLM response as JSON')
    }
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

  console.log(`[LLM] Calling ${isZhipu ? 'Zhipu GLM' : 'OpenAI'} with model: ${LLM_CONFIG.model}`)

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
    console.error(`[LLM] API error response:`, JSON.stringify(data))
    throw new Error(`LLM API error (${res.status}): ${data.error?.message || JSON.stringify(data)}`)
  }

  // 检查返回数据结构
  if (!data.choices?.[0]?.message?.content) {
    console.error(`[LLM] Invalid response structure:`, JSON.stringify(data))
    throw new Error(`Invalid LLM response: missing choices[0].message.content`)
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

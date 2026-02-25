"use client";

import { useState, useMemo } from "react";
import { Header } from "./Header";

interface Article {
  id: string;
  title: string;
  titleZh: string | null;
  titleEn: string | null;
  originalUrl: string;
  publishedAt: string;
  summary: string | null;
  summarySimple: string | null;
  summaryDeep: string | null;
  summaryEn: string | null;
  summarySimpleEn: string | null;
  summaryDeepEn: string | null;
  difficulty: string | null;
  imageUrl: string | null;
  source: { name: string; category: string };
  tags: string[];
  lang: string | null;
}

interface Tag {
  id: string;
  name: string;
  count: number;
}

interface ClientPageProps {
  initialArticles: Article[];
  tags: Tag[];
}

type Language = "zh" | "en";

// 多语言文本
const i18n = {
  zh: {
    title: "AI News Daily",
    subtitle: "每日精选 AI 行业动态与前沿技术",
    all: "全部",
    beginner: "入门",
    general: "通用",
    advanced: "进阶",
    allTags: "全部标签",
    noArticles: "没有匹配的文章",
    noSummary: "暂无摘要",
  },
  en: {
    title: "AI News Daily",
    subtitle: "Daily curated AI industry news and cutting-edge technology",
    all: "All",
    beginner: "Beginner",
    general: "General",
    advanced: "Advanced",
    allTags: "All Tags",
    noArticles: "No matching articles",
    noSummary: "No summary available",
  },
};

export function ClientPage({ initialArticles, tags }: ClientPageProps) {
  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [lang, setLang] = useState<Language>("zh");

  const t = i18n[lang];

  // 客户端过滤文章
  const filteredArticles = useMemo(() => {
    return initialArticles.filter((article) => {
      if (difficulty && article.difficulty !== difficulty) {
        return false;
      }
      if (selectedTag && !article.tags.includes(selectedTag)) {
        return false;
      }
      return true;
    });
  }, [initialArticles, difficulty, selectedTag]);

  // 获取显示标题
  const getDisplayTitle = (article: Article) => {
    if (lang === "zh") {
      return article.titleZh || article.title;
    }
    return article.titleEn || article.title;
  };

  // 获取显示摘要
  const getDisplaySummary = (article: Article) => {
    if (lang === "zh") {
      return article.summarySimple || article.summary || t.noSummary;
    }
    return article.summarySimpleEn || article.summaryEn || t.noSummary;
  };

  // 获取难度显示文本
  const getDifficultyLabel = (diff: string) => {
    const labels: Record<string, Record<Language, string>> = {
      beginner: { zh: "入门", en: "Beginner" },
      general: { zh: "通用", en: "General" },
      advanced: { zh: "进阶", en: "Advanced" },
    };
    return labels[diff]?.[lang] || diff;
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header lang={lang} setLang={setLang} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Hero */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-4">
            {t.title}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg">
            {t.subtitle}
          </p>
        </div>

        {/* Difficulty Filter */}
        <div className="mb-6 flex gap-2 justify-center">
          <FilterButton
            onClick={() => setDifficulty(null)}
            label={t.all}
            active={!difficulty}
          />
          <FilterButton
            onClick={() => setDifficulty("beginner")}
            label={t.beginner}
            active={difficulty === "beginner"}
          />
          <FilterButton
            onClick={() => setDifficulty("general")}
            label={t.general}
            active={difficulty === "general"}
          />
          <FilterButton
            onClick={() => setDifficulty("advanced")}
            label={t.advanced}
            active={difficulty === "advanced"}
          />
        </div>

        {/* Tags */}
        <div className="mb-8 flex flex-wrap gap-2 justify-center">
          <TagButton
            onClick={() => setSelectedTag(null)}
            label={t.allTags}
            active={!selectedTag}
          />
          {tags.map((tag) => (
            <TagButton
              key={tag.id}
              onClick={() => setSelectedTag(tag.name)}
              label={`${tag.name} ${tag.count}`}
              active={selectedTag === tag.name}
            />
          ))}
        </div>

        {/* Articles Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.map((article) => (
            <ArticleCardClient
              key={article.id}
              article={article}
              lang={lang}
              getDisplayTitle={getDisplayTitle}
              getDisplaySummary={getDisplaySummary}
              getDifficultyLabel={getDifficultyLabel}
              noSummaryText={t.noSummary}
            />
          ))}
        </div>

        {filteredArticles.length === 0 && (
          <div className="text-center py-20 text-zinc-500">
            <p className="text-lg">{t.noArticles}</p>
          </div>
        )}
      </main>
    </div>
  );
}

function FilterButton({
  onClick,
  label,
  active,
}: {
  onClick: () => void;
  label: string;
  active: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
        active
          ? "bg-blue-600 text-white"
          : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
      }`}
    >
      {label}
    </button>
  );
}

function TagButton({
  onClick,
  label,
  active,
}: {
  onClick: () => void;
  label: string;
  active: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm transition-colors cursor-pointer ${
        active
          ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
          : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300"
      }`}
    >
      {label}
    </button>
  );
}

// 客户端版本的文章卡片
function ArticleCardClient({
  article,
  lang,
  getDisplayTitle,
  getDisplaySummary,
  getDifficultyLabel,
  noSummaryText,
}: {
  article: Article;
  lang: Language;
  getDisplayTitle: (a: Article) => string;
  getDisplaySummary: (a: Article) => string;
  getDifficultyLabel: (d: string) => string;
  noSummaryText: string;
}) {
  const difficultyColor = {
    beginner: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    general: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    advanced: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  };

  const timeAgo = getTimeAgo(new Date(article.publishedAt), lang);

  return (
    <a
      href={article.originalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:shadow-lg transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-700"
    >
      {article.imageUrl && (
        <div className="aspect-video bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <img
            src={article.imageUrl}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mb-2">
          <span className="font-medium text-blue-600 dark:text-blue-400">
            {article.source.name}
          </span>
          <span>·</span>
          <span>{timeAgo}</span>
          {article.difficulty && (
            <>
              <span>·</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${
                  difficultyColor[article.difficulty as keyof typeof difficultyColor] ||
                  difficultyColor.general
                }`}
              >
                {getDifficultyLabel(article.difficulty)}
              </span>
            </>
          )}
        </div>

        <h2 className="font-semibold text-zinc-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {getDisplayTitle(article)}
        </h2>

        <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3">
          {getDisplaySummary(article)}
        </p>

        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {article.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-xs text-zinc-600 dark:text-zinc-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </a>
  );
}

function getTimeAgo(date: Date, lang: Language): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (lang === "zh") {
    if (seconds < 60) return "刚刚";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} 分钟前`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} 小时前`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} 天前`;
    return date.toLocaleDateString("zh-CN");
  } else {
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return date.toLocaleDateString("en-US");
  }
}

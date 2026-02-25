import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

interface Article {
  id: string;
  title: string;
  originalUrl: string;
  publishedAt: Date;
  summary: string | null;
  summarySimple: string | null;
  summaryDeep: string | null;
  difficulty: string | null;
  imageUrl: string | null;
  source: { name: string; category: string };
  tags: { tag: { name: string } }[];
}

export function ArticleCard({ article }: { article: Article }) {
  const difficultyColor = {
    beginner: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    general: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    advanced: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  };

  const timeAgo = formatDistanceToNow(new Date(article.publishedAt), {
    addSuffix: true,
    locale: zhCN,
  });

  return (
    <a
      href={article.originalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:shadow-lg transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-700"
    >
      {/* Image */}
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
        {/* Meta */}
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
                {article.difficulty === "beginner"
                  ? "入门"
                  : article.difficulty === "advanced"
                  ? "进阶"
                  : "通用"}
              </span>
            </>
          )}
        </div>

        {/* Title */}
        <h2 className="font-semibold text-zinc-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {article.title}
        </h2>

        {/* Summary */}
        <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3">
          {article.summarySimple || article.summary || "暂无摘要"}
        </p>

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {article.tags.slice(0, 3).map((t) => (
              <span
                key={t.tag.name}
                className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-xs text-zinc-600 dark:text-zinc-400"
              >
                {t.tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </a>
  );
}

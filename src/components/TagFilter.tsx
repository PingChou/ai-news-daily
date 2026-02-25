interface Tag {
  id: string;
  name: string;
  _count: { articles: number };
}

interface TagFilterProps {
  tags: Tag[];
  selectedTag?: string;
  difficulty?: string;
}

export function TagFilter({ tags, selectedTag, difficulty }: TagFilterProps) {
  const buildHref = (tagName?: string) => {
    const params = new URLSearchParams();
    if (difficulty) params.set("difficulty", difficulty);
    if (tagName) params.set("tag", tagName);
    const queryString = params.toString();
    return queryString ? `/?${queryString}` : "/";
  };

  return (
    <div className="mb-8 flex flex-wrap gap-2 justify-center">
      <a
        href={buildHref()}
        className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
          !selectedTag
            ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
            : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300"
        }`}
      >
        全部标签
      </a>
      {tags.map((tag) => (
        <a
          key={tag.id}
          href={buildHref(tag.name)}
          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
            selectedTag === tag.name
              ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
              : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300"
          }`}
        >
          {tag.name}
          <span className="ml-1 text-zinc-400 dark:text-zinc-500">
            {tag._count.articles}
          </span>
        </a>
      ))}
    </div>
  );
}

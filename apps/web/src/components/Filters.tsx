interface Props {
  query: string;
  onQuery: (q: string) => void;
  categories: string[];
  category: string;
  onCategory: (c: string) => void;
}

/** Search box plus category chips. An empty category means "All". */
export function Filters({ query, onQuery, categories, category, onCategory }: Props) {
  return (
    <div className="filters">
      <input
        className="search"
        type="search"
        placeholder="Search events"
        aria-label="Search events"
        value={query}
        onChange={(e) => onQuery(e.target.value)}
      />
      <div className="chips" role="group" aria-label="Filter by category">
        {["", ...categories].map((c) => (
          <button key={c || "all"} type="button" className="chip" aria-pressed={category === c} onClick={() => onCategory(c)}>
            {c || "All"}
          </button>
        ))}
      </div>
    </div>
  );
}

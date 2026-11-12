export type Tab = "upcoming" | "past";

interface Props {
  value: Tab;
  counts: Record<Tab, number>;
  onChange: (tab: Tab) => void;
}

/** The 48px pill switch between Upcoming and Past. */
export function StatusTabs({ value, counts, onChange }: Props) {
  const tabs: { id: Tab; label: string }[] = [
    { id: "upcoming", label: "Upcoming" },
    { id: "past", label: "Past" },
  ];
  return (
    <div className="switch" role="tablist" aria-label="Show events">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={value === tab.id}
          onClick={() => onChange(tab.id)}
          type="button"
        >
          {tab.label}
          <span className="count">{counts[tab.id]}</span>
        </button>
      ))}
    </div>
  );
}

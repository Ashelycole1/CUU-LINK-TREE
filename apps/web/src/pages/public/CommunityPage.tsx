import { useMemo, useState, type CSSProperties } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { CommunityEventDTO } from "@event-tree/api-client";
import { SiteNav } from "../../components/brand/SiteNav";
import { Chip, CoverArt, Icon, categoryIcon } from "../../components/ui";
import { api } from "../../lib/api";
import { dayNumber, headerTint, monthShort, startsIn, weekdayShort } from "../../lib/dates";
import { useResource } from "../../lib/useResource";

const WEEK = 7 * 86_400_000;

/** Splits events by where they are in time: on now, this week, later. */
function group(items: CommunityEventDTO[], now = Date.now()) {
  const live = items.filter((x) => x.event.status === "live");
  const soon = items.filter((x) => x.event.status !== "live" && new Date(x.event.startsAt).getTime() - now < WEEK);
  const later = items.filter((x) => x.event.status !== "live" && new Date(x.event.startsAt).getTime() - now >= WEEK);
  return [
    { id: "now", title: "Happening now", items: live },
    { id: "week", title: "This week", items: soon },
    { id: "later", title: "Coming up", items: later },
  ].filter((g) => g.items.length > 0);
}

/**
 * Community: upcoming events from every Event Tree page, grouped by when
 * they happen (now, this week, later) and filtered by category.
 */
export function CommunityPage() {
  const data = useResource(() => api.getCommunity({ limit: 100 }), []);
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState("");
  const category = params.get("category") ?? "";

  const total = data.data?.events.length ?? 0;
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (data.data?.events ?? []).filter(
      ({ event: e, host }) =>
        (!category || e.category === category) &&
        (!needle || [e.title, e.venue, e.category, host.displayName].some((v) => v?.toLowerCase().includes(needle))),
    );
  }, [data.data, category, q]);
  const groups = group(shown);

  const pick = (c: string) => setParams(c ? { category: c } : {}, { replace: true });

  return (
    <div className="cm">
      <SiteNav />

      <header className="cm-head">
        <p className="cm-kicker">Community</p>
        <h1>What's on</h1>
        <p className="cm-lead">Upcoming events from every Event Tree page, soonest first.</p>
      </header>

      <div className="cm-bar">
        <label className="cm-search">
          <Icon name="search" size={18} />
          <span className="sr-only">Search events</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search events, venues, hosts" type="search" />
        </label>
        <div className="cm-chips" role="group" aria-label="Category">
          <Chip selected={!category} onClick={() => pick("")} count={total}>
            All
          </Chip>
          {(data.data?.categories ?? []).map((c) => (
            <Chip key={c.name} selected={category === c.name} onClick={() => pick(category === c.name ? "" : c.name)} count={c.count}>
              <Icon name={categoryIcon(c.name)} size={14} />
              {c.name}
            </Chip>
          ))}
        </div>
      </div>

      <main className="cm-body">
        {data.loading && !data.data && (
          <div className="cm-grid" aria-hidden="true">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="cm-card is-skeleton">
                <div className="cm-art skel" />
                <div className="skel skel-line" style={{ height: 16, width: "70%" }} />
                <div className="skel skel-line" style={{ height: 12, width: "45%" }} />
              </div>
            ))}
          </div>
        )}
        {data.error && (
          <p className="loading-note" role="alert">
            {data.error.message}
          </p>
        )}
        {data.data && groups.length === 0 && (
          <div className="cm-empty">
            <Icon name="calendar" size={32} />
            <h2>{total === 0 ? "Nothing announced yet" : "No events match"}</h2>
            <p>{total === 0 ? "When hosts add upcoming events, they show up here." : "Try another category or search."}</p>
            {(category || q) && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setQ("");
                  pick("");
                }}
              >
                Show everything
              </button>
            )}
          </div>
        )}

        {groups.map((g) => (
          <section key={g.id} className="cm-group" aria-labelledby={`cm-${g.id}`}>
            <h2 id={`cm-${g.id}`} className="cm-h2">
              {g.id === "now" && <span className="live-pip" aria-hidden="true" />}
              {g.title} <span>{g.items.length}</span>
            </h2>
            <ul className="cm-grid" role="list">
              {g.items.map(({ event: e, host }) => (
                <li key={e.id}>
                  <Link className="cm-card" to={`/${host.username}/${e.slug}`} style={{ "--host-tint": headerTint(host.color) } as CSSProperties}>
                    <div className="cm-art">
                      <CoverArt src={e.coverImage?.url} name={e.title} category={e.category} radius="inherit" />
                      <span className="cm-date" aria-hidden="true">
                        <span>{monthShort(e.startsAt)}</span>
                        <b>{dayNumber(e.startsAt)}</b>
                      </span>
                      <span className="cm-cat">{e.category}</span>
                    </div>
                    <div className="cm-text">
                      <b className="cm-title">{e.title}</b>
                      <span className={`cm-when${e.status === "live" ? " is-live" : ""}`}>
                        {e.status === "live"
                          ? "Happening now"
                          : `${weekdayShort(e.startsAt)} ${new Date(e.startsAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} · ${startsIn(e.startsAt, e.endsAt).replace("Starts ", "")}`}
                      </span>
                      {e.venue && <span className="cm-venue">{e.venue}</span>}
                      <span className="cm-host">
                        <CoverArt src={host.avatarUrl || null} name={host.displayName} icon="users" size={20} round />
                        {host.displayName}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </div>
  );
}

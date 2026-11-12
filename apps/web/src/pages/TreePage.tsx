import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EventButton } from "../components/EventButton";
import { Filters } from "../components/Filters";
import { NextUpCard } from "../components/NextUpCard";
import { Page, StatusNote } from "../components/Page";
import { ProfileHeader } from "../components/ProfileHeader";
import { StatusTabs, type Tab } from "../components/StatusTabs";
import { useProfile } from "../components/ThemeProvider";
import { api } from "../lib/api";
import { SessionStore } from "../lib/SessionStore";
import { useResource } from "../lib/useResource";

const tabStore = new SessionStore<Tab>("event-tree:tab", "upcoming");

/** The tree itself: profile header, Next up row, Upcoming/Past switch, filters and the event buttons. */
export function TreePage() {
  const profile = useProfile();
  const [tab, setTab] = useState<Tab>(tabStore.get);
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(query), 250);
    return () => window.clearTimeout(id);
  }, [query]);

  const upcoming = useResource(() => api().listEvents({ when: "upcoming" }), []);
  const past = useResource(() => api().listEvents({ when: "past" }), []);
  const categories = useResource(() => api().getCategories(), []);
  const list = useResource(
    () => api().listEvents({ when: tab, category: category || undefined, q: debounced || undefined }),
    [tab, category, debounced],
  );

  const changeTab = (next: Tab) => {
    tabStore.set(next);
    setTab(next);
  };

  if (!profile.data) {
    return (
      <Page>
        <StatusNote loading={profile.loading} error={profile.error} onRetry={profile.reload} />
      </Page>
    );
  }

  const nextUp = (upcoming.data ?? []).slice(0, 3);

  return (
    <Page
      action={
        <Link className="corner right" to="/new" aria-label="Post an event">
          +
        </Link>
      }
    >
      <ProfileHeader profile={profile.data} upcomingCount={upcoming.data?.length ?? 0} />

      {nextUp.length > 0 && (
        <section aria-label="Next up">
          <h2 className="head">Next up</h2>
          <div className="next-row">
            {nextUp.map((e) => (
              <NextUpCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}

      <StatusTabs
        value={tab}
        onChange={changeTab}
        counts={{ upcoming: upcoming.data?.length ?? 0, past: past.data?.length ?? 0 }}
      />
      <Filters
        query={query}
        onQuery={setQuery}
        categories={categories.data ?? []}
        category={category}
        onCategory={setCategory}
      />

      <section aria-live="polite">
        <StatusNote loading={list.loading && !list.data} error={list.error} onRetry={list.reload} />
        {list.data?.length === 0 && (
          <p className="muted center pad">
            {tab === "upcoming" ? "Nothing coming up that matches." : "No past events match."}
          </p>
        )}
        <div className="event-list">
          {list.data?.map((e) => (
            <EventButton key={e.id} event={e} />
          ))}
        </div>
      </section>

      <Link className="post-cta" to="/new">
        + Post an upcoming event
      </Link>
    </Page>
  );
}

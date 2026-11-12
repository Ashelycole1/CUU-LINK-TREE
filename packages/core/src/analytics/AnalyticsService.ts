import { NotFoundError } from "../shared/errors";
import type { Clock, IdGenerator } from "../shared/ports";
import type { AnalyticsRecord, AnalyticsSummaryDTO } from "../dto";
import type { EventRepository } from "../events/EventRepository";
import type { ProfileRepository } from "../profile/Profile";

export interface AnalyticsRepository {
  add(record: AnalyticsRecord): Promise<void>;
  findByOwner(ownerId: string, since: Date): Promise<AnalyticsRecord[]>;
}

const DAY = 86_400_000;

/**
 * Page views and event clicks, like Linktree's Insights. Only counts are
 * kept: no IP addresses, cookies or user agents.
 */
export class AnalyticsService {
  static readonly MAX_DAYS = 90;

  constructor(
    private readonly analytics: AnalyticsRepository,
    private readonly profiles: ProfileRepository,
    private readonly events: EventRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async recordView(username: string): Promise<void> {
    const profile = await this.profiles.findByUsername(username.toLowerCase());
    if (!profile) throw new NotFoundError("Page", username);
    await this.analytics.add({ id: this.ids.next(), ownerId: profile.ownerId, type: "view", eventId: null, at: this.clock.now().toISOString() });
  }

  async recordClick(eventId: string): Promise<void> {
    const event = await this.events.findById(eventId);
    if (!event || event.hidden) throw new NotFoundError("Event", eventId);
    await this.analytics.add({ id: this.ids.next(), ownerId: event.ownerId, type: "click", eventId, at: this.clock.now().toISOString() });
  }

  async summary(ownerId: string, days = 14): Promise<AnalyticsSummaryDTO> {
    const span = Math.min(Math.max(Math.round(days) || 14, 1), AnalyticsService.MAX_DAYS);
    const now = this.clock.now();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - (span - 1) * DAY);
    const records = await this.analytics.findByOwner(ownerId, start);

    const series = Array.from({ length: span }, (_, i) => ({
      date: new Date(start.getTime() + i * DAY).toISOString().slice(0, 10),
      views: 0,
      clicks: 0,
    }));
    const clicksByEvent = new Map<string, number>();
    let views = 0;
    let clicks = 0;
    for (const r of records) {
      const day = series[Math.floor((new Date(r.at).getTime() - start.getTime()) / DAY)];
      if (!day) continue;
      if (r.type === "view") {
        day.views += 1;
        views += 1;
      } else {
        day.clicks += 1;
        clicks += 1;
        if (r.eventId) clicksByEvent.set(r.eventId, (clicksByEvent.get(r.eventId) ?? 0) + 1);
      }
    }

    const titles = new Map((await this.events.findByOwner(ownerId)).map((e) => [e.id, e.title]));
    const topEvents = [...clicksByEvent.entries()]
      .filter(([id]) => titles.has(id))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([eventId, n]) => ({ eventId, title: titles.get(eventId)!, clicks: n }));

    return { days: span, views, clicks, clickRate: views ? Math.round((clicks / views) * 1000) / 1000 : 0, series, topEvents };
  }
}

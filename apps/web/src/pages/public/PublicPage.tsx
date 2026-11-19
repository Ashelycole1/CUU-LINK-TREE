import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import type { EventDTO } from "@event-tree/api-client";
import { HostPage } from "../../components/host/HostPage";
import { api } from "../../lib/api";
import { useResource } from "../../lib/useResource";
import { PageSkeleton } from "../../components/ui/PageSkeleton";
import { NotFoundPage } from "../NotFoundPage";
import { posthog } from "../../lib/posthog";
import { ANALYTICS_EVENTS } from "../../lib/analyticsEvents";

/**
 * A host's public page at /:username. Counts a page view on load, and a
 * click when a visitor opens an event. The dashboard preview passes
 * ?preview=1 so the host's own looks are not counted.
 */
export function PublicPage() {
  const { username = "" } = useParams();
  const [params] = useSearchParams();
  const preview = params.has("preview");
  const tree = useResource(() => api.getPage(username), [username, params.get("v")]);

  useEffect(() => {
    if (preview || !tree.data) return;
    document.title = `${tree.data.profile.displayName} | Event Tree`;
    void api.recordView(username).catch(() => undefined);
  }, [preview, tree.data, username]);

  const onOpen = (event: EventDTO) => {
    if (preview) return;
    posthog.capture(ANALYTICS_EVENTS.eventOpened, { event_status: event.status });
    void api.recordClick(event.id).catch(() => undefined);
  };

  if (tree.error?.isNotFound) return <NotFoundPage message={`There's no Event Tree at /${username} yet.`} />;
  if (!tree.data) return tree.error ? <p className="loading-note" role="alert">{tree.error.message}</p> : <PageSkeleton variant="tree" />;
  return <HostPage tree={tree.data} onOpen={onOpen} />;
}

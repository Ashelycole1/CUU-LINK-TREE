import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import type { EventDTO } from "@event-tree/api-client";
import { TreeView } from "../../components/tree/TreeView";
import { api } from "../../lib/api";
import { useResource } from "../../lib/useResource";
import { NotFoundPage } from "../NotFoundPage";

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
    if (!preview) void api.recordClick(event.id).catch(() => undefined);
  };

  if (tree.error?.isNotFound) return <NotFoundPage message={`There's no Event Tree at /${username} yet.`} />;
  if (!tree.data) return <p className="loading-note">{tree.error ? tree.error.message : "Loading…"}</p>;
  return <TreeView tree={tree.data} onOpen={onOpen} />;
}

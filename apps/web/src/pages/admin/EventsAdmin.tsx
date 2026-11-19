import { useState } from "react";
import { ApiError, type CreateEventInput, type EventDTO } from "@event-tree/api-client";
import { EventCard } from "../../components/admin/EventCard";
import { EventEditor } from "../../components/admin/EventEditor";
import { api, pageUrl } from "../../lib/api";
import { useAuth } from "../../auth/AuthContext";
import { useResource } from "../../lib/useResource";
import { Icon } from "../../components/ui/Icon";
import { useDialog } from "../../lib/useDialog";
import { useToast } from "../../components/ui";
import { useAdmin } from "./AdminLayout";
import { posthog } from "../../lib/posthog";
import { posthogLogs } from "../../lib/posthogLogs";

/** The main dashboard screen: add, edit, hide, reorder and delete events. */
export function EventsAdmin() {
  const { refreshPreview } = useAdmin();
  const { user } = useAuth();
  const events = useResource(() => api.listMyEvents(), []);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<EventDTO | null>(null);
  const [notice, setNotice] = useState("");
  const toast = useToast();

  const list = events.data ?? [];
  const shown = list.filter((e) => !e.hidden).length;
  const live = list.filter((e) => e.status === "live" && !e.hidden).length;
  const upcoming = list.filter((e) => e.status === "upcoming" && !e.hidden).length;

  function done(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2500);
    refreshPreview();
  }

  async function run(action: () => Promise<unknown>, message: string, event?: "event_visibility_changed" | "event_deleted") {
    try {
      await action();
      if (event) {
        posthog.capture(event);
        posthogLogs.info("Event management action completed", { operation: event });
      }
      events.reload();
      done(message);
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : "That didn't work. Try again.");
    }
  }

  async function create(input: CreateEventInput) {
    await api.createEvent(input);
    posthog.capture("event_created");
    posthogLogs.info("Event management action completed", { operation: "event_created" });
    setEditing(null);
    events.reload();
    refreshPreview();
    if (user) toast(`"${input.title}" is on your page`, { tone: "success", action: { label: "View", href: pageUrl(user.username).href } });
  }

  async function update(event: EventDTO, input: CreateEventInput) {
    await api.updateEvent(event.id, input);
    posthog.capture("event_updated");
    posthogLogs.info("Event management action completed", { operation: "event_updated" });
    setEditing(null);
    events.reload();
    done("Changes saved");
  }

  function move(index: number, direction: -1 | 1) {
    const ids = list.map((e) => e.id);
    const target = index + direction;
    [ids[index], ids[target]] = [ids[target]!, ids[index]!];
    events.set(ids.map((id) => list.find((e) => e.id === id)!)); // instant feedback
    void run(() => api.reorderEvents(ids), "Order saved");
  }

  return (
    <div className="events-admin">
      <header className="admin-heading ev-head">
        <h1>Your events</h1>
        {events.data && list.length > 0 && (
          <p className="ev-summary" aria-label="Your page at a glance">
            {live > 0 && (
              <span className="ev-summary-live">
                <span className="live-pip" aria-hidden="true" />
                {live} live now
              </span>
            )}
            <span>{upcoming} upcoming</span>
            <span>
              {shown} of {list.length} shown on your page
            </span>
          </p>
        )}
      </header>

      <div className="ev-toolbar">
        <button
          type="button"
          className="ev-add"
          onClick={() => setEditing("new")}
          aria-expanded={editing === "new"}
          disabled={editing === "new"}
        >
          <span className="ev-add-circle" aria-hidden="true">
            <Icon name="plus" size={26} />
          </span>
          <span className="ev-add-text">
            <b>Add event</b>
            <span>It goes to the top of your page</span>
          </span>
        </button>
        <p className="notice" role="status" aria-live="polite">
          {notice}
        </p>
      </div>

      {editing === "new" && (
        <div className="panel ev-editor">
          <h2 className="panel-title">New event</h2>
          <EventEditor onSave={create} onCancel={() => setEditing(null)} />
        </div>
      )}

      {events.loading && !events.data && (
        <div className="ev-table" role="status" aria-label="Loading your events">
          {[0, 1, 2].map((i) => (
            <span key={i} className="skel ev-skel" />
          ))}
        </div>
      )}
      {events.error && <p className="form-error">{events.error.message}</p>}
      {events.data && list.length === 0 && editing !== "new" && (
        <div className="ev-empty">
          <b>Your page is waiting for its first event</b>
          <p>Add one and it shows up on your page straight away, with a countdown to the start.</p>
          <button type="button" className="btn btn-primary" onClick={() => setEditing("new")}>
            <Icon name="plus" size={18} /> Add your first event
          </button>
        </div>
      )}

      {list.length > 0 && (
        <div className="ev-table" role="table" aria-label="Your events">
          <div className="ev-row ev-row--head" role="row">
            <span role="columnheader" className="ev-index">
              #
            </span>
            <span role="columnheader">Event</span>
            <span role="columnheader" className="ev-when">
              When
            </span>
            <span role="columnheader" className="ev-status">
              Status
            </span>
            <span role="columnheader" className="ev-actions">
              Shown
            </span>
          </div>
          {list.map((event, i) =>
            editing === event.id ? (
              <div className="panel ev-editor" key={event.id}>
                <h2 className="panel-title">Edit event</h2>
                <EventEditor event={event} onSave={(input) => update(event, input)} onCancel={() => setEditing(null)} />
              </div>
            ) : (
              <EventCard
                key={event.id}
                event={event}
                index={i}
                isFirst={i === 0}
                isLast={i === list.length - 1}
                onMove={(d) => move(i, d)}
                onToggle={() => run(() => api.updateEvent(event.id, { hidden: !event.hidden }), event.hidden ? "Shown on your page" : "Hidden from your page", "event_visibility_changed")}
                onEdit={() => setEditing(event.id)}
                onDelete={() => setConfirmDelete(event)}
              />
            ),
          )}
        </div>
      )}

      {confirmDelete && (
        <DeleteDialog
          event={confirmDelete}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => {
            const target = confirmDelete;
            setConfirmDelete(null);
            void run(() => api.deleteEvent(target.id), "Event deleted", "event_deleted");
          }}
        />
      )}
    </div>
  );
}

/** Asks before deleting. Escape or a click outside keeps the event; "Keep it" has focus first so Enter is safe. */
function DeleteDialog({ event, onCancel, onConfirm }: { event: EventDTO; onCancel: () => void; onConfirm: () => void }) {
  const keep = useDialog<HTMLButtonElement>(true, onCancel);
  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-desc">
        <h2 id="delete-title">Delete “{event.title}”?</h2>
        <p id="delete-desc">
          This removes the event, its photos and its reviews. You can't undo this. To take it off your page for now, hide it instead.
        </p>
        <div className="editor-actions">
          <button ref={keep} type="button" className="btn btn-ghost" onClick={onCancel}>
            Keep it
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm}>
            <Icon name="trash" size={18} /> Delete event
          </button>
        </div>
      </div>
    </div>
  );
}

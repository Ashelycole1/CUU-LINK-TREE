import { useState } from "react";
import { ApiError, type CreateEventInput, type EventDTO } from "@event-tree/api-client";
import { EventCard } from "../../components/admin/EventCard";
import { EventEditor } from "../../components/admin/EventEditor";
import { api } from "../../lib/api";
import { useResource } from "../../lib/useResource";
import { useAdmin } from "./AdminLayout";

/** The main dashboard screen: add, edit, hide, reorder and delete events. */
export function EventsAdmin() {
  const { refreshPreview } = useAdmin();
  const events = useResource(() => api.listMyEvents(), []);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<EventDTO | null>(null);
  const [notice, setNotice] = useState("");

  const list = events.data ?? [];

  function done(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2500);
    refreshPreview();
  }

  async function run(action: () => Promise<unknown>, message: string) {
    try {
      await action();
      events.reload();
      done(message);
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : "That didn't work. Try again.");
    }
  }

  async function create(input: CreateEventInput) {
    await api.createEvent(input);
    setEditing(null);
    events.reload();
    done("Event added");
  }

  async function update(event: EventDTO, input: CreateEventInput) {
    await api.updateEvent(event.id, input);
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
      <div className="admin-heading">
        <h1>Events</h1>
        <p>Your newest event goes to the top. Use the arrows to change the order on your page.</p>
      </div>

      {editing === "new" ? (
        <div className="panel">
          <h2 className="panel-title">New event</h2>
          <EventEditor onSave={create} onCancel={() => setEditing(null)} />
        </div>
      ) : (
        <button type="button" className="add-event" onClick={() => setEditing("new")}>
          + Add event
        </button>
      )}

      <p className="notice" role="status" aria-live="polite">
        {notice}
      </p>

      {events.loading && !events.data && <p className="muted">Loading your events…</p>}
      {events.error && <p className="form-error">{events.error.message}</p>}
      {events.data && list.length === 0 && editing !== "new" && (
        <div className="empty-state">
          <b>No events yet.</b>
          <p>Add your first one. It shows up on your page right away.</p>
        </div>
      )}

      <div className="event-cards">
        {list.map((event, i) =>
          editing === event.id ? (
            <div className="panel" key={event.id}>
              <h2 className="panel-title">Edit event</h2>
              <EventEditor event={event} onSave={(input) => update(event, input)} onCancel={() => setEditing(null)} />
            </div>
          ) : (
            <EventCard
              key={event.id}
              event={event}
              isFirst={i === 0}
              isLast={i === list.length - 1}
              onMove={(d) => move(i, d)}
              onToggle={() => run(() => api.updateEvent(event.id, { hidden: !event.hidden }), event.hidden ? "Shown on your page" : "Hidden from your page")}
              onEdit={() => setEditing(event.id)}
              onDelete={() => setConfirmDelete(event)}
            />
          ),
        )}
      </div>

      {confirmDelete && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="delete-title">
          <div className="modal">
            <h2 id="delete-title">Delete “{confirmDelete.title}”?</h2>
            <p>This removes the event, its photos and its reviews. You can't undo this. To take it off your page for now, hide it instead.</p>
            <div className="editor-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>
                Keep it
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  const target = confirmDelete;
                  setConfirmDelete(null);
                  void run(() => api.deleteEvent(target.id), "Event deleted");
                }}
              >
                Delete event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

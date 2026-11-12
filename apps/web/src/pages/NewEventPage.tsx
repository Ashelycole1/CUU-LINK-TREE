import { useNavigate } from "react-router-dom";
import { EventForm } from "../components/EventForm";
import { Page } from "../components/Page";
import { api } from "../lib/api";
import { useResource } from "../lib/useResource";

export function NewEventPage() {
  const navigate = useNavigate();
  const categories = useResource(() => api().getCategories(), []);

  return (
    <Page back>
      <h1 className="page-title">Post an event</h1>
      <EventForm
        categories={categories.data ?? []}
        onCreated={(event) => navigate(`/e/${event.slug}`)}
      />
    </Page>
  );
}

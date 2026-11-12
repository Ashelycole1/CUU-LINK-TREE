import { Link } from "react-router-dom";
import { Page } from "../components/Page";

export function NotFoundPage() {
  return (
    <Page back>
      <div className="center pad">
        <h1>Page not found</h1>
        <Link className="link-btn primary" to="/">
          See all events
        </Link>
      </div>
    </Page>
  );
}

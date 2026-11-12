import { Link } from "react-router-dom";
import { Logo } from "../components/brand/Logo";

export function NotFoundPage({ message = "That page doesn't exist." }: { message?: string }) {
  return (
    <div className="plain-page">
      <Logo />
      <h1>Nothing here</h1>
      <p>{message}</p>
      <div className="plain-actions">
        <Link className="btn btn-primary" to="/signup">
          Claim this name
        </Link>
        <Link className="btn btn-ghost" to="/">
          Go to Event Tree
        </Link>
      </div>
    </div>
  );
}

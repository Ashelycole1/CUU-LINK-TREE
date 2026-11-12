import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

/** "yoursite/ [yourname] [Claim your page]": sends the name on to sign-up. */
export function ClaimForm({ size = "large" }: { size?: "large" | "small" }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const host = window.location.host;

  function submit(e: FormEvent) {
    e.preventDefault();
    navigate(`/signup${name.trim() ? `?username=${encodeURIComponent(name.trim().toLowerCase())}` : ""}`);
  }

  return (
    <form className={`claim claim--${size}`} onSubmit={submit}>
      <label className="claim-field">
        <span className="claim-host">{host}/</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value.replace(/\s/g, ""))}
          placeholder="yourname"
          aria-label="Choose your username"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={30}
        />
      </label>
      <button className="btn btn-pink" type="submit">
        Claim your page
      </button>
    </form>
  );
}

interface Props {
  value: number;
  onChange: (stars: number) => void;
}

/** Five radio buttons styled as stars, so keyboard and screen readers work as normal. */
export function StarInput({ value, onChange }: Props) {
  return (
    <fieldset className="star-input">
      <legend>Your rating</legend>
      {[1, 2, 3, 4, 5].map((n) => (
        <label key={n} className={n <= value ? "on" : ""}>
          <input type="radio" name="rating" value={n} checked={value === n} onChange={() => onChange(n)} />
          <span aria-hidden="true">★</span>
          <span className="sr-only">
            {n} star{n > 1 ? "s" : ""}
          </span>
        </label>
      ))}
    </fieldset>
  );
}

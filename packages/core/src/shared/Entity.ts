/**
 * Base class for objects with identity. Two entities are equal when their
 * ids match, whatever their other fields hold.
 */
export abstract class Entity<TId extends string = string> {
  protected constructor(readonly id: TId) {}

  equals(other: Entity<TId> | null | undefined): boolean {
    return other != null && other.constructor === this.constructor && other.id === this.id;
  }
}

/**
 * Base class for immutable values compared by content (an image link, a rating).
 */
export abstract class ValueObject<TProps extends object> {
  protected readonly props: Readonly<TProps>;

  protected constructor(props: TProps) {
    this.props = Object.freeze({ ...props });
  }

  equals(other: ValueObject<TProps> | null | undefined): boolean {
    return other != null && JSON.stringify(other.props) === JSON.stringify(this.props);
  }
}

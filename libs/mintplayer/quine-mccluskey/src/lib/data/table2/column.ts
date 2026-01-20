/**
 * Represents a column in Table 2 of the Quine-McCluskey algorithm.
 * Each column represents a minterm that needs to be covered.
 */
export class Table2Column {
  /**
   * The minterm index this column represents.
   */
  readonly minterm: number;

  /**
   * Whether this minterm has been covered by an essential prime implicant.
   */
  isCovered: boolean;

  constructor(minterm: number) {
    this.minterm = minterm;
    this.isCovered = false;
  }
}

import { Table1Record } from '../table1';
import { Table2Column } from './column';
import { Table2Row } from './row';

/**
 * Represents Table 2 of the Quine-McCluskey algorithm.
 * This table maps prime implicants to the minterms they cover.
 */
export class Table2 {
  /**
   * Rows representing prime implicants.
   */
  rows: Table2Row[];

  /**
   * Columns representing minterms to be covered.
   */
  columns: Table2Column[];

  /**
   * Set of minterms that still need to be covered.
   */
  private uncoveredMinterms: Set<number>;

  constructor(primeImplicants: Table1Record[], minterms: number[]) {
    // Create rows for each prime implicant
    this.rows = primeImplicants.map((record) => new Table2Row(record));

    // Create columns for each minterm (excluding don't cares)
    this.columns = minterms.map((m) => new Table2Column(m));

    // Initialize uncovered minterms
    this.uncoveredMinterms = new Set(minterms);
  }

  /**
   * Finds essential prime implicants.
   * An essential prime implicant is one that is the only implicant covering a minterm.
   * @returns Array of essential prime implicant rows
   */
  findEssentialPrimeImplicants(): Table2Row[] {
    const essential: Table2Row[] = [];

    for (const column of this.columns) {
      if (column.isCovered) {
        continue;
      }

      // Find rows that cover this minterm
      const coveringRows = this.rows.filter(
        (row) => !row.isSelected && row.coversMinterm(column.minterm)
      );

      // If exactly one row covers this minterm, it's essential
      if (coveringRows.length === 1) {
        const essentialRow = coveringRows[0];
        if (!essentialRow.isSelected) {
          essentialRow.isSelected = true;
          essential.push(essentialRow);

          // Mark all minterms covered by this essential prime implicant
          this.markCovered(essentialRow);
        }
      }
    }

    return essential;
  }

  /**
   * Marks all minterms covered by a row as covered.
   */
  private markCovered(row: Table2Row): void {
    for (const minterm of row.getCoveredMinterms()) {
      const column = this.columns.find((c) => c.minterm === minterm);
      if (column) {
        column.isCovered = true;
      }
      this.uncoveredMinterms.delete(minterm);
    }
  }

  /**
   * Gets the set of minterms that are still uncovered.
   */
  getUncoveredMinterms(): Set<number> {
    return new Set(this.uncoveredMinterms);
  }

  /**
   * Gets rows that have not been selected yet.
   */
  getUnselectedRows(): Table2Row[] {
    return this.rows.filter((row) => !row.isSelected);
  }

  /**
   * Checks if all minterms are covered.
   */
  isFullyCovered(): boolean {
    return this.uncoveredMinterms.size === 0;
  }

  /**
   * Selects a row and marks its covered minterms.
   */
  selectRow(row: Table2Row): void {
    row.isSelected = true;
    this.markCovered(row);
  }

  /**
   * Gets all selected rows (the solution).
   */
  getSelectedRows(): Table2Row[] {
    return this.rows.filter((row) => row.isSelected);
  }
}

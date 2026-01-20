import { Table1Record } from '../table1';
import { Table2Column } from './column';

/**
 * Represents a row in Table 2 of the Quine-McCluskey algorithm.
 * Each row represents a prime implicant and tracks which minterms it covers.
 */
export class Table2Row {
  /**
   * The prime implicant record from Table 1.
   */
  readonly record: Table1Record;

  /**
   * Map of minterm to coverage status for this prime implicant.
   */
  private coverage: Map<number, boolean>;

  /**
   * Whether this row has been selected as part of the solution.
   */
  isSelected: boolean;

  constructor(record: Table1Record) {
    this.record = record;
    this.coverage = new Map();
    this.isSelected = false;

    // Initialize coverage based on minterms covered by this record
    for (const minterm of record.minterms) {
      this.coverage.set(minterm, true);
    }
  }

  /**
   * Checks if this prime implicant covers the specified minterm.
   */
  coversMinterm(minterm: number): boolean {
    return this.coverage.has(minterm);
  }

  /**
   * Gets all minterms covered by this prime implicant.
   */
  getCoveredMinterms(): number[] {
    return [...this.coverage.keys()];
  }

  /**
   * Counts how many of the specified uncovered minterms this row covers.
   */
  countCoverage(uncoveredMinterms: Set<number>): number {
    let count = 0;
    for (const minterm of this.coverage.keys()) {
      if (uncoveredMinterms.has(minterm)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Gets the number of literals (non-don't-care bits) in this prime implicant.
   * Fewer literals = simpler expression.
   */
  getLiteralCount(): number {
    return this.record.bits.filter((b) => b !== 2).length; // 2 = DontCare
  }
}

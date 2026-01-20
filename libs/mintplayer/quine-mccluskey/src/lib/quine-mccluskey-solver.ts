import { Table1Column, Table1Record } from './data/table1';
import { Table2, Table2Row } from './data/table2';
import { IQuineMcCluskeySolver, IRequiredLoop } from './interfaces';
import { RequiredLoop } from './required-loop';

/**
 * Implementation of the Quine-McCluskey algorithm for Boolean function minimization.
 * This algorithm finds the minimal sum-of-products expression for a Boolean function.
 */
export class QuineMcCluskeySolver implements IQuineMcCluskeySolver {
  /**
   * Solves Boolean minimization using the Quine-McCluskey algorithm.
   * @param minterms - Array of minterm indices where the output is 1
   * @param dontcares - Array of don't-care term indices
   * @param numVariables - Optional: explicit number of variables (auto-detected if not provided)
   * @returns Promise resolving to array of required loops (essential prime implicants)
   */
  async solve(
    minterms: number[],
    dontcares: number[],
    numVariables?: number
  ): Promise<IRequiredLoop[]> {
    // Handle edge cases
    if (minterms.length === 0) {
      return [];
    }

    // Determine number of variables
    const allTerms = [...minterms, ...dontcares];
    const maxTerm = Math.max(...allTerms);
    const detectedVars =
      maxTerm === 0 ? 1 : Math.ceil(Math.log2(maxTerm + 1));
    const vars = numVariables ?? detectedVars;

    // Validate that all terms fit within the variable count
    const maxPossibleTerm = (1 << vars) - 1;
    for (const term of allTerms) {
      if (term > maxPossibleTerm) {
        throw new Error(
          `Term ${term} exceeds maximum possible value ${maxPossibleTerm} for ${vars} variables`
        );
      }
    }

    // Step 1: Create Table 1 and find prime implicants
    const primeImplicants = this.findPrimeImplicants(
      minterms,
      dontcares,
      vars
    );

    // If no prime implicants found, return empty
    if (primeImplicants.length === 0) {
      return [];
    }

    // Step 2: Create Table 2 and find essential prime implicants
    const selectedImplicants = this.selectPrimeImplicants(
      primeImplicants,
      minterms
    );

    // Convert to RequiredLoop objects
    return selectedImplicants.map(
      (record) => new RequiredLoop(record.minterms, record.bits)
    );
  }

  /**
   * Step 1: Find all prime implicants using iterative combining.
   */
  private findPrimeImplicants(
    minterms: number[],
    dontcares: number[],
    numVariables: number
  ): Table1Record[] {
    // Combine minterms and don't cares for finding prime implicants
    const allTerms = [...new Set([...minterms, ...dontcares])];

    // Create the first column with initial minterms
    let currentColumn = new Table1Column();
    for (const term of allTerms) {
      const record = Table1Record.fromMinterm(term, numVariables);
      currentColumn.addRecord(record);
    }

    // Collect all prime implicants (unused records from all columns)
    const allPrimeImplicants: Table1Record[] = [];

    // Keep combining until no more combinations are possible
    while (!currentColumn.isEmpty()) {
      const nextColumn = this.combineColumn(currentColumn);

      // Collect unused records from current column (these are prime implicants)
      allPrimeImplicants.push(...currentColumn.getUnusedRecords());

      currentColumn = nextColumn;
    }

    // Remove duplicates based on minterm coverage
    return this.deduplicatePrimeImplicants(allPrimeImplicants);
  }

  /**
   * Combines adjacent groups in a column to create the next column.
   */
  private combineColumn(column: Table1Column): Table1Column {
    const nextColumn = new Table1Column();
    const groups = column.getSortedGroups();

    // Compare adjacent groups
    for (let i = 0; i < groups.length - 1; i++) {
      const currentGroup = groups[i];
      const nextGroup = groups[i + 1];

      // Try to combine each record in current group with each record in next group
      for (const record1 of currentGroup.records) {
        for (const record2 of nextGroup.records) {
          const differPos = record1.canCombineWith(record2);

          if (differPos >= 0) {
            // Mark both records as used
            record1.isUsed = true;
            record2.isUsed = true;

            // Create combined record
            const combined = record1.combineWith(record2, differPos);
            nextColumn.addRecord(combined);
          }
        }
      }
    }

    return nextColumn;
  }

  /**
   * Removes duplicate prime implicants.
   */
  private deduplicatePrimeImplicants(
    implicants: Table1Record[]
  ): Table1Record[] {
    const seen = new Set<string>();
    const unique: Table1Record[] = [];

    for (const imp of implicants) {
      const key = imp.getKey();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(imp);
      }
    }

    return unique;
  }

  /**
   * Step 2: Select the minimum set of prime implicants that cover all minterms.
   */
  private selectPrimeImplicants(
    primeImplicants: Table1Record[],
    minterms: number[]
  ): Table1Record[] {
    // Create Table 2
    const table2 = new Table2(primeImplicants, minterms);

    // Find essential prime implicants
    table2.findEssentialPrimeImplicants();

    // If all minterms are covered, we're done
    if (table2.isFullyCovered()) {
      return table2.getSelectedRows().map((row) => row.record);
    }

    // Apply Petrick's method for remaining uncovered minterms
    this.applyPetricksMethod(table2);

    return table2.getSelectedRows().map((row) => row.record);
  }

  /**
   * Applies Petrick's method to find a minimal cover for remaining minterms.
   * This is a simplified greedy implementation.
   */
  private applyPetricksMethod(table2: Table2): void {
    const uncovered = table2.getUncoveredMinterms();
    const unselectedRows = table2.getUnselectedRows();

    if (uncovered.size === 0 || unselectedRows.length === 0) {
      return;
    }

    // Filter to rows that cover at least one uncovered minterm
    const relevantRows = unselectedRows.filter(
      (row) => row.countCoverage(uncovered) > 0
    );

    if (relevantRows.length === 0) {
      return;
    }

    // Use a greedy approach: repeatedly select the row that covers the most uncovered minterms
    // In case of tie, prefer fewer literals (simpler expression)
    while (!table2.isFullyCovered()) {
      const currentUncovered = table2.getUncoveredMinterms();
      const candidates = table2
        .getUnselectedRows()
        .filter((row) => row.countCoverage(currentUncovered) > 0);

      if (candidates.length === 0) {
        break;
      }

      // Sort by coverage (descending), then by literal count (ascending)
      candidates.sort((a, b) => {
        const coverageDiff =
          b.countCoverage(currentUncovered) - a.countCoverage(currentUncovered);
        if (coverageDiff !== 0) {
          return coverageDiff;
        }
        return a.getLiteralCount() - b.getLiteralCount();
      });

      // Select the best candidate
      table2.selectRow(candidates[0]);
    }
  }
}

/**
 * Factory function to create a QuineMcCluskeySolver instance.
 */
export function createQuineMcCluskeySolver(): IQuineMcCluskeySolver {
  return new QuineMcCluskeySolver();
}

import { Table1Group } from './group';
import { Table1Record } from './record';

/**
 * Represents a column in Table 1 of the Quine-McCluskey algorithm.
 * Each column contains groups organized by Hamming weight.
 * The first column contains the original minterms, subsequent columns contain combined terms.
 */
export class Table1Column {
  /**
   * Groups organized by number of 1-bits (Hamming weight).
   * Index corresponds to the number of 1-bits.
   */
  groups: Map<number, Table1Group>;

  constructor() {
    this.groups = new Map();
  }

  /**
   * Gets or creates a group for the specified number of 1-bits.
   */
  getOrCreateGroup(onesCount: number): Table1Group {
    let group = this.groups.get(onesCount);
    if (!group) {
      group = new Table1Group(onesCount);
      this.groups.set(onesCount, group);
    }
    return group;
  }

  /**
   * Adds a record to the appropriate group based on its Hamming weight.
   */
  addRecord(record: Table1Record): void {
    const onesCount = record.countOnes();
    const group = this.getOrCreateGroup(onesCount);

    // Check for duplicates
    if (!group.containsRecord(record)) {
      group.addRecord(record);
    }
  }

  /**
   * Gets all groups sorted by Hamming weight.
   */
  getSortedGroups(): Table1Group[] {
    const sortedKeys = [...this.groups.keys()].sort((a, b) => a - b);
    return sortedKeys.map((key) => this.groups.get(key)!);
  }

  /**
   * Gets all records in this column.
   */
  getAllRecords(): Table1Record[] {
    const records: Table1Record[] = [];
    for (const group of this.groups.values()) {
      records.push(...group.records);
    }
    return records;
  }

  /**
   * Gets all unused records (prime implicants) in this column.
   */
  getUnusedRecords(): Table1Record[] {
    const records: Table1Record[] = [];
    for (const group of this.groups.values()) {
      for (const record of group.records) {
        if (!record.isUsed) {
          records.push(record);
        }
      }
    }
    return records;
  }

  /**
   * Checks if the column has any records.
   */
  isEmpty(): boolean {
    return this.groups.size === 0;
  }
}

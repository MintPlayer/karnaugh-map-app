import { Table1Record } from './record';

/**
 * Represents a group of records in Table 1 that have the same number of 1-bits.
 * Groups are organized by Hamming weight (number of True bits).
 */
export class Table1Group {
  /**
   * The number of 1-bits (Hamming weight) for all records in this group.
   */
  readonly onesCount: number;

  /**
   * The records in this group.
   */
  records: Table1Record[];

  constructor(onesCount: number) {
    this.onesCount = onesCount;
    this.records = [];
  }

  /**
   * Adds a record to this group.
   * @param record - The record to add
   */
  addRecord(record: Table1Record): void {
    this.records.push(record);
  }

  /**
   * Checks if the group contains a record with the same minterms.
   * @param record - The record to check
   */
  containsRecord(record: Table1Record): boolean {
    const key = record.getKey();
    return this.records.some((r) => r.getKey() === key);
  }
}

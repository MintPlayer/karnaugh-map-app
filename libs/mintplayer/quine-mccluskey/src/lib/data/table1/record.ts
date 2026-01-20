import { ELogicState } from '../../enums';

/**
 * Represents a single record in Table 1 of the Quine-McCluskey algorithm.
 * Each record represents a minterm or a combination of minterms.
 */
export class Table1Record {
  /**
   * The minterms that this record covers.
   * Initially contains a single minterm, but grows as records are combined.
   */
  minterms: number[];

  /**
   * Binary representation of the term using logic states.
   * The length equals the number of variables.
   * DontCare bits indicate positions where minterms were combined.
   */
  bits: ELogicState[];

  /**
   * Whether this record has been used to create a new combined record.
   * Unused records at the end become prime implicants.
   */
  isUsed: boolean;

  constructor(minterms: number[], bits: ELogicState[]) {
    this.minterms = [...minterms];
    this.bits = [...bits];
    this.isUsed = false;
  }

  /**
   * Creates a record from a decimal minterm value.
   * @param minterm - The decimal value of the minterm
   * @param numVariables - The number of variables (bit width)
   */
  static fromMinterm(minterm: number, numVariables: number): Table1Record {
    const bits: ELogicState[] = [];
    for (let i = numVariables - 1; i >= 0; i--) {
      bits.push((minterm >> i) & 1 ? ELogicState.True : ELogicState.False);
    }
    return new Table1Record([minterm], bits);
  }

  /**
   * Counts the number of True (1) bits in this record.
   */
  countOnes(): number {
    return this.bits.filter((b) => b === ELogicState.True).length;
  }

  /**
   * Checks if this record can be combined with another record.
   * Two records can be combined if they differ in exactly one bit position
   * and that position is not already a don't-care in either record.
   */
  canCombineWith(other: Table1Record): number {
    if (this.bits.length !== other.bits.length) {
      return -1;
    }

    let differingPosition = -1;
    let differCount = 0;

    for (let i = 0; i < this.bits.length; i++) {
      if (this.bits[i] !== other.bits[i]) {
        // If either is DontCare and they differ, can't combine
        if (
          this.bits[i] === ELogicState.DontCare ||
          other.bits[i] === ELogicState.DontCare
        ) {
          return -1;
        }
        differingPosition = i;
        differCount++;
        if (differCount > 1) {
          return -1;
        }
      }
    }

    return differingPosition;
  }

  /**
   * Combines this record with another record at the specified position.
   * @param other - The other record to combine with
   * @param position - The bit position where they differ
   * @returns A new combined record
   */
  combineWith(other: Table1Record, position: number): Table1Record {
    const newBits = [...this.bits];
    newBits[position] = ELogicState.DontCare;

    const newMinterms = [...new Set([...this.minterms, ...other.minterms])];
    newMinterms.sort((a, b) => a - b);

    return new Table1Record(newMinterms, newBits);
  }

  /**
   * Creates a unique key for this record based on its minterms.
   * Used for deduplication.
   */
  getKey(): string {
    return this.minterms.join(',');
  }

  /**
   * Checks if this record equals another record (same minterms and bits).
   */
  equals(other: Table1Record): boolean {
    if (this.minterms.length !== other.minterms.length) {
      return false;
    }
    if (this.bits.length !== other.bits.length) {
      return false;
    }

    for (let i = 0; i < this.minterms.length; i++) {
      if (this.minterms[i] !== other.minterms[i]) {
        return false;
      }
    }

    for (let i = 0; i < this.bits.length; i++) {
      if (this.bits[i] !== other.bits[i]) {
        return false;
      }
    }

    return true;
  }
}

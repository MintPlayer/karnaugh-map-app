import { ELogicState } from './enums';
import { IRequiredLoop } from './interfaces';

/**
 * Implementation of a required loop (prime implicant).
 * Represents a term in the minimized Boolean expression.
 */
export class RequiredLoop implements IRequiredLoop {
  /**
   * The minterms covered by this prime implicant.
   */
  readonly minterms: number[];

  /**
   * The bit pattern of this prime implicant.
   * Each element is True (1), False (0), or DontCare (eliminated variable).
   */
  private readonly bits: ELogicState[];

  constructor(minterms: number[], bits: ELogicState[]) {
    this.minterms = [...minterms].sort((a, b) => a - b);
    this.bits = [...bits];
  }

  /**
   * Converts the loop to a Boolean expression string.
   * @param inputVariables - Array of variable names (e.g., ['A', 'B', 'C', 'D'])
   * @returns Boolean expression (e.g., "A'BC" where ' denotes NOT)
   */
  toString(inputVariables: string[]): string {
    if (this.bits.length === 0) {
      return '1';
    }

    // Check if all bits are don't cares (covers all minterms)
    if (this.bits.every((b) => b === ELogicState.DontCare)) {
      return '1';
    }

    const terms: string[] = [];

    for (let i = 0; i < this.bits.length; i++) {
      const varName = inputVariables[i] || `x${i}`;

      switch (this.bits[i]) {
        case ELogicState.False:
          // Variable is complemented (NOT)
          terms.push(`${varName}'`);
          break;
        case ELogicState.True:
          // Variable is not complemented
          terms.push(varName);
          break;
        case ELogicState.DontCare:
          // Variable is eliminated (don't include)
          break;
      }
    }

    if (terms.length === 0) {
      return '1';
    }

    return terms.join('');
  }

  /**
   * Gets the bit pattern of this prime implicant.
   */
  getBits(): ELogicState[] {
    return [...this.bits];
  }

  /**
   * Gets the number of literals (non-don't-care bits).
   */
  getLiteralCount(): number {
    return this.bits.filter((b) => b !== ELogicState.DontCare).length;
  }

  /**
   * Checks if this loop equals another loop.
   */
  equals(other: RequiredLoop): boolean {
    if (this.minterms.length !== other.minterms.length) {
      return false;
    }

    for (let i = 0; i < this.minterms.length; i++) {
      if (this.minterms[i] !== other.minterms[i]) {
        return false;
      }
    }

    return true;
  }
}

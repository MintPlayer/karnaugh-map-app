/**
 * Represents a prime implicant (required loop) in a Boolean function minimization.
 * A required loop covers one or more minterms and can be expressed as a Boolean term.
 */
export interface IRequiredLoop {
  /**
   * Array of minterm indices covered by this prime implicant.
   */
  readonly minterms: number[];

  /**
   * Converts the loop to a Boolean expression string.
   * @param inputVariables - Array of variable names (e.g., ['A', 'B', 'C', 'D'])
   * @returns Boolean expression (e.g., "A'BC" where ' denotes NOT)
   */
  toString(inputVariables: string[]): string;
}

import { IRequiredLoop } from './required-loop.interface';

/**
 * Interface for the Quine-McCluskey Boolean minimization solver.
 */
export interface IQuineMcCluskeySolver {
  /**
   * Solves Boolean minimization using the Quine-McCluskey algorithm.
   * @param minterms - Array of minterm indices where the output is 1
   * @param dontcares - Array of don't-care term indices
   * @param numVariables - Optional: explicit number of variables (auto-detected if not provided)
   * @returns Promise resolving to array of required loops (essential prime implicants)
   */
  solve(
    minterms: number[],
    dontcares: number[],
    numVariables?: number
  ): Promise<IRequiredLoop[]>;
}

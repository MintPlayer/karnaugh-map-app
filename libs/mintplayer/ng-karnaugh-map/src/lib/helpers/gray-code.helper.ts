/**
 * Helper class for Gray code operations used in Karnaugh maps.
 * Gray code ensures adjacent cells differ by only one bit.
 */
export class GrayCodeHelper {
  /**
   * Converts a binary number to Gray code.
   * @param binary - The binary number to convert
   * @returns The Gray code equivalent
   */
  static binaryToGray(binary: number): number {
    return binary ^ (binary >> 1);
  }

  /**
   * Converts a Gray code number to binary.
   * @param gray - The Gray code number to convert
   * @returns The binary equivalent
   */
  static grayToBinary(gray: number): number {
    let binary = gray;
    let mask = gray >> 1;
    while (mask !== 0) {
      binary ^= mask;
      mask >>= 1;
    }
    return binary;
  }

  /**
   * Generates a Gray code sequence for a given number of bits.
   * @param bits - The number of bits
   * @returns Array of Gray code values in order
   */
  static generateGrayCode(bits: number): number[] {
    if (bits <= 0) {
      return [0];
    }

    const count = 1 << bits; // 2^bits
    const result: number[] = [];

    for (let i = 0; i < count; i++) {
      result.push(this.binaryToGray(i));
    }

    return result;
  }

  /**
   * Converts a grid position (row, col) to a minterm index.
   * Uses Gray code for both row and column indices.
   * @param row - The row index in the grid
   * @param col - The column index in the grid
   * @param rowBits - Number of bits for row variables
   * @param colBits - Number of bits for column variables
   * @returns The minterm index
   */
  static gridPositionToMinterm(
    row: number,
    col: number,
    rowBits: number,
    colBits: number
  ): number {
    // Convert row and column indices to their Gray code values
    const rowGray = this.binaryToGray(row);
    const colGray = this.binaryToGray(col);

    // Combine: row bits are most significant, column bits are least significant
    return (rowGray << colBits) | colGray;
  }

  /**
   * Converts a minterm index to a grid position (row, col).
   * @param minterm - The minterm index
   * @param rowBits - Number of bits for row variables
   * @param colBits - Number of bits for column variables
   * @returns Object containing row and column indices
   */
  static mintermToGridPosition(
    minterm: number,
    rowBits: number,
    colBits: number
  ): { row: number; col: number } {
    // Extract the Gray code values for row and column
    const colMask = (1 << colBits) - 1;
    const colGray = minterm & colMask;
    const rowGray = minterm >> colBits;

    // Convert Gray code back to binary for grid indices
    const col = this.grayToBinary(colGray);
    const row = this.grayToBinary(rowGray);

    return { row, col };
  }

  /**
   * Formats a Gray code value as a binary string with leading zeros.
   * @param value - The value to format
   * @param bits - The number of bits to display
   * @returns Formatted binary string
   */
  static formatGrayCode(value: number, bits: number): string {
    return value.toString(2).padStart(bits, '0');
  }

  /**
   * Calculates the number of row and column bits for a given number of variables.
   * Column bits = ceil(n/2), Row bits = floor(n/2)
   * @param numVariables - Total number of input variables
   * @returns Object containing rowBits and colBits
   */
  static calculateGridDimensions(numVariables: number): {
    rowBits: number;
    colBits: number;
    rows: number;
    cols: number;
  } {
    const colBits = Math.ceil(numVariables / 2);
    const rowBits = Math.floor(numVariables / 2);

    return {
      rowBits,
      colBits,
      rows: 1 << rowBits, // 2^rowBits
      cols: 1 << colBits, // 2^colBits
    };
  }

  /**
   * Gets the variable names for rows and columns based on distribution.
   * @param variables - Array of all variable names
   * @returns Object containing rowVars and colVars arrays
   */
  static distributeVariables(variables: string[]): {
    rowVars: string[];
    colVars: string[];
  } {
    const n = variables.length;
    const colCount = Math.ceil(n / 2);
    const rowCount = Math.floor(n / 2);

    // First variables go to rows, remaining to columns
    const rowVars = variables.slice(0, rowCount);
    const colVars = variables.slice(rowCount);

    return { rowVars, colVars };
  }
}

import { ECellValue } from '../enums';

/**
 * Represents a cell in the Karnaugh map grid.
 */
export interface IKarnaughMapCell {
  /** Row index in the grid */
  row: number;
  /** Column index in the grid */
  column: number;
  /** The minterm index this cell represents */
  minterm: number;
  /** The current value of the cell */
  value: ECellValue;
  /** Whether this cell is currently selected (in Solve mode) */
  isSelected: boolean;
}

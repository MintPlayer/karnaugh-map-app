import { ECellValue } from '../enums';

/**
 * Represents the serializable state of a Karnaugh map.
 */
export interface IKarnaughMapState {
  /** Array of variable names */
  inputVariables: string[];
  /** Output variable name */
  outputVariable: string;
  /** Map of minterm index to cell value */
  cellValues: { [minterm: number]: ECellValue };
}

/**
 * Represents the value of a cell in the Karnaugh map.
 */
export enum ECellValue {
  /** Cell value has not been set */
  Undefined = -1,
  /** Output is 0 (false) */
  Zero = 0,
  /** Output is 1 (true) */
  One = 1,
  /** Don't care condition */
  DontCare = 2,
}

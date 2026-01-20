/**
 * Represents the logical state of a bit in a Boolean expression.
 */
export enum ELogicState {
  /** The bit is 0 (false) */
  False = 0,
  /** The bit is 1 (true) */
  True = 1,
  /** The bit is a don't care (can be either 0 or 1) */
  DontCare = 2,
}

import { IRequiredLoop } from '@mintplayer/quine-mccluskey';

/**
 * Event emitted when the Karnaugh map is solved.
 */
export interface IKarnaughMapSolvedEvent {
  /** Minimized loops for cells with value 1 */
  onesLoops: IRequiredLoop[];
  /** Minimized loops for cells with value 0 */
  zerosLoops: IRequiredLoop[];
}

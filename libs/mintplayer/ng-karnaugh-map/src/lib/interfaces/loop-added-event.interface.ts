import { IRequiredLoop } from '@mintplayer/quine-mccluskey';

/**
 * Event emitted when a loop is added during solving.
 */
export interface ILoopAddedEvent {
  /** The loop that was added */
  loop: IRequiredLoop;
  /** Whether this loop is for cells with value 1 (true) or 0 (false) */
  isForOnes: boolean;
}

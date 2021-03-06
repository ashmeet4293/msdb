import { EventSession } from '../event-session';
import { EventEntry } from '../event-entry';

export class EventEntryResult {
    constructor(
        public id?: number,
        public startingPosition?: number,
        public finalPosition?: number,
        public totalTime?: number,
        public bestLapTime?: number,
        public lapsCompleted?: number,
        public lapsLed?: number,
        public difference?: number,
        public differenceType?: number,
        public retired?: boolean,
        public cause?: string,
        public pitlaneStart?: boolean,
        public entry?: EventEntry,
        public session?: EventSession,
        public sharedDriveWith?: EventEntry,
    ) { }

}

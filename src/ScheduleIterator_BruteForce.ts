import {DeviceBatchSchedule, DeviceSchedule} from "./DeviceSchedule";

export class ScheduleIterator_BruteForce implements IterableIterator<DeviceBatchSchedule> {
    private readonly currentIndices: number[];
    private hasNext: boolean;

    constructor(public deviceSchedules: DeviceSchedule[][]) {
        this.currentIndices = new Array(this.deviceSchedules.length).fill(0);
        this.hasNext = deviceSchedules.length > 0 && deviceSchedules.some(pt => pt.length > 0);
    }

    private shiftIndices(): boolean {
        this.currentIndices[0]++;

        let carry = this.currentIndices[0] >= this.deviceSchedules[0].length;
        let idx = 0;
        while (carry) {
            this.currentIndices[idx++] = 0;

            if (idx == this.currentIndices.length) {
                return false;
            }

            this.currentIndices[idx]++;
            carry = this.currentIndices[idx] == this.deviceSchedules[idx].length;
        }
        return true;
    }

    public next(): IteratorResult<DeviceBatchSchedule> {
        if (!this.hasNext) {
            return {
                done: true,
                value: null,
            }
        }

        let deviceSchedules: DeviceSchedule[] =
            this.currentIndices.map((scheduleIdx, deviceIdx) => {
                return this.deviceSchedules[deviceIdx][scheduleIdx];
            });
        let result = new DeviceBatchSchedule(deviceSchedules);

        this.hasNext = this.shiftIndices();

        return {
            done: false,
            value: result,
        };
    }

    [Symbol.iterator]() {
        return this;
    }
}

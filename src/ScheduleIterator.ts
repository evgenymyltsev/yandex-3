import {DeviceBatchSchedule, DeviceSchedule} from "./DeviceSchedule";
import * as _ from 'lodash';
import * as Collections from 'typescript-collections';

class Step {
    public indicesStr: string;

    constructor(public indices: number[]) {
        this.indicesStr = indices.toString();
    }
}

export class ScheduleIterator implements IterableIterator<DeviceBatchSchedule> {
    private readonly currentIndices: number[];
    private readonly devicesCount: number;
    private history: Step[] = [];
    private historyIdx: number = 0;
    private historyIdxLast: number = 0;
    private activeDeviceIdx: number = null;
    private seenSteps = new Collections.Set<number[]>();

    constructor(public deviceSchedules: DeviceSchedule[][]) {
        for (let dss of this.deviceSchedules) {
            dss.sort((x, y) => x.totalRate - y.totalRate);
        }

        this.devicesCount = this.deviceSchedules.length;
        this.currentIndices = _.fill(new Array(this.devicesCount), 0);
    }

    private composeBatchSchedule(indices: number[]): DeviceBatchSchedule {
        // console.log(indices);
        let deviceSchedules: DeviceSchedule[] =
            indices.map((scheduleIdx, deviceIdx) => {
                return this.deviceSchedules[deviceIdx][scheduleIdx];
            });
        return new DeviceBatchSchedule(deviceSchedules);
    }

    private allCompleted(): boolean {
        for (let i = 0; i < this.devicesCount; i++) {
            if (this.currentIndices[i] < this.deviceSchedules[i].length - 1) {
                return false;
            }
        }
        return true;
    }

    private findMinIdx(): number {
        let minIdx: number = null;
        for (let i = 0; i < this.devicesCount; i++) {
            if (this.currentIndices[i] + 1 == this.deviceSchedules[i].length) {
                continue;
            }
            if (_.isNull(minIdx)) {
                minIdx = i;
                continue;
            }
            if (this.deviceSchedules[i][this.currentIndices[i]].totalRate <
                this.deviceSchedules[minIdx][this.currentIndices[minIdx]].totalRate) {
                minIdx = i;
            }
        }
        return minIdx;
    }

    public next(): IteratorResult<DeviceBatchSchedule> {
        if (this.history.length == 0) {
            if (this.allCompleted()) {
                return {done: true, value: null}
            }

            const indices = _.clone(this.currentIndices);
            this.history.push(new Step(indices));
            this.seenSteps.add(indices);
            const r = this.composeBatchSchedule(indices);
            return {done: false, value: r}
        }

        let indices = _.clone(this.history[this.historyIdx].indices);
        if (!_.isNull(this.activeDeviceIdx)) {
            indices[this.activeDeviceIdx] = this.currentIndices[this.activeDeviceIdx];
        }

        while (this.historyIdx < this.historyIdxLast && this.seenSteps.contains(indices)) {
            this.historyIdx++;
            indices = _.clone(this.history[this.historyIdx].indices);
            indices[this.activeDeviceIdx] = this.currentIndices[this.activeDeviceIdx];
        }

        if (this.historyIdx == this.historyIdxLast) {
            if (this.allCompleted()) {
                return {done: true, value: null}
            }

            const minIdx = this.findMinIdx();
            this.historyIdx = 0;
            this.historyIdxLast = this.history.length;
            this.activeDeviceIdx = minIdx;
            this.currentIndices[this.activeDeviceIdx]++;
            this.seenSteps.clear();
        }

        indices = _.clone(this.history[this.historyIdx].indices);
        indices[this.activeDeviceIdx] = this.currentIndices[this.activeDeviceIdx];
        this.history.push(new Step(indices));
        this.historyIdx++;

        const r = this.composeBatchSchedule(indices);
        this.seenSteps.add(indices);
        return {done: false, value: r}
    }

    [Symbol.iterator]() {
        return this;
    }
}

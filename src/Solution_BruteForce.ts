import {DeviceBatchSchedule, DeviceSchedule} from "./DeviceSchedule";
import * as _ from 'lodash';
import * as inputData from "./InputData";
import {SolutionMode} from "./SolutionMode";
import {Output} from "./OutputData";
import {computeAllSchedules} from "./AllSchedules";

class ScheduleIterator_BruteForce implements IterableIterator<DeviceBatchSchedule> {
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
        result.indices = _.clone(this.currentIndices);

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

function compareArrays(arr1: number[], arr2: number[]): number {
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] != arr2[i]) {
            return arr1[i] - arr2[i];
        }
    }
    return 0;
}

export class Solution_BruteForce {
    constructor(public input: inputData.Input,
                public mode: SolutionMode = SolutionMode.Production) { }

    public solve(): Output[] {
        const allSchedules = computeAllSchedules(this.input);

        const combs = Array.from(new ScheduleIterator_BruteForce(allSchedules));
        // console.log(`bruteforce - count of combinations: ${combs.length}`);

        combs.sort((x, y) => {
            if (x.totalConsumption == y.totalConsumption) {
                return compareArrays(x.indices, y.indices);
            } else {
                return x.totalConsumption - y.totalConsumption;
            }
        });

        if (this.mode == SolutionMode.AllPossible) {
            return combs.map(x => x.toOutput());
        }

        const validCombs = combs.filter(x => x.isValid(this.input.maxPower));
        if (validCombs.length == 0) {
            return [];
        }

        if (this.mode == SolutionMode.AllValid) {
            return validCombs.map(x => x.toOutput());
        }

        const minimumConsumption: number = _.head(validCombs).totalConsumption;
        if (this.mode == SolutionMode.AllMinimal) {
            const answer = _.takeWhile(validCombs, x => x.totalConsumption == minimumConsumption);
            return answer.map(x => x.toOutput());
        }

        if (this.mode == SolutionMode.Production) {
            const answer = _.head(validCombs).toOutput();
            return [answer];
        }

        throw new Error(`Unexpected mode: ${this.mode}`);
    }
}

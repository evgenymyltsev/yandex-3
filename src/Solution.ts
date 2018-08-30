import {DeviceBatchSchedule, DeviceSchedule} from "./DeviceSchedule";
import * as _ from 'lodash';
import * as inputData from "./InputData";
import {Output} from "./OutputData";
import {computeAllSchedules} from "./AllSchedules";
import {SolutionMode} from "./SolutionMode";

class DeviceHourShiftOfEqualConsumption {
    public schedules: DeviceSchedule[] = [];

    constructor(public totalRate: number) { }
}

class ArraysIndiciesIterator<T> implements IterableIterator<number[]> {
    private readonly currentIndices: number[];
    private hasNext: boolean;

    constructor(public arrays: T[][]) {
        this.currentIndices = new Array(this.arrays.length).fill(0);
        this.hasNext = arrays.length > 0 && arrays.some(pt => pt.length > 0);
    }

    private shiftIndices(): boolean {
        this.currentIndices[0]++;

        let carry = this.currentIndices[0] >= this.arrays[0].length;
        let idx = 0;
        while (carry) {
            this.currentIndices[idx++] = 0;

            if (idx == this.currentIndices.length) {
                return false;
            }

            this.currentIndices[idx]++;
            carry = this.currentIndices[idx] == this.arrays[idx].length;
        }
        return true;
    }

    public next(): IteratorResult<number[]> {
        if (!this.hasNext) {
            return {
                done: true,
                value: null,
            }
        }

        const res = _.clone(this.currentIndices);
        this.hasNext = this.shiftIndices();

        return {done: false, value: res};
    }

    [Symbol.iterator]() {
        return this;
    }
}

class HourShiftSchedules {
    constructor(public indices: number[],
                public totalConsumption: number,
                public schedules: DeviceSchedule[][]) { }
}

export class Solution {
    constructor(private input: inputData.Input,
                private mode: SolutionMode = SolutionMode.Production) {
    }

    private routine(hourShiftSchedules: Array<HourShiftSchedules>) {
        const answer: DeviceBatchSchedule[] = [];
        for (let hourShiftSchedule of hourShiftSchedules) {
            // console.log(hourShiftSchedule.totalConsumption);
            for (const indices of new ArraysIndiciesIterator(hourShiftSchedule.schedules)) {
                const dbs = new DeviceBatchSchedule(
                    indices.map((x, idx) => hourShiftSchedule.schedules[idx][x])
                );
                switch (this.mode) {
                    case SolutionMode.Production:
                        if (dbs.isValid(this.input.maxPower)) {
                            answer.push(dbs);
                            return answer;
                        }
                        break;

                    case SolutionMode.AllMinimal:
                        if (dbs.isValid(this.input.maxPower)) {
                            if (answer.length == 0 || dbs.totalConsumption == _.head(answer).totalConsumption) {
                                answer.push(dbs);
                            }
                        }
                        break;

                    case SolutionMode.AllPossible:
                        answer.push(dbs);
                        break;

                    case SolutionMode.AllValid:
                        if (dbs.isValid(this.input.maxPower)) {
                            answer.push(dbs);
                        }
                        break;
                }
            }
        }
        return answer;
    }


    public solve(): Output[] {
        const allDevicesSchedules = computeAllSchedules(this.input);

        const deviceHourShiftOfEqualConsumption: DeviceHourShiftOfEqualConsumption[][] = [];

        for (let i = 0; i < allDevicesSchedules.length; i++) {
            const arr: DeviceHourShiftOfEqualConsumption[] = [];
            let currentTotalRate: number = null;
            for (const deviceSchedule of allDevicesSchedules[i]) {
                if (_.isNull(currentTotalRate) || currentTotalRate != deviceSchedule.totalRate) {
                    currentTotalRate = deviceSchedule.totalRate;
                    arr.push(new DeviceHourShiftOfEqualConsumption(currentTotalRate));
                }
                _.last(arr).schedules.push(deviceSchedule);
            }
            deviceHourShiftOfEqualConsumption.push(arr);
        }

        const hourShiftSchedules: Array<HourShiftSchedules> = [];
        for (const indices of new ArraysIndiciesIterator(deviceHourShiftOfEqualConsumption)) {
            let totalConsumption = 0;
            let schedules: DeviceSchedule[][] = [];
            for (let i = 0; i < indices.length; i++) {
                totalConsumption += deviceHourShiftOfEqualConsumption[i][indices[i]].totalRate;
                schedules.push(deviceHourShiftOfEqualConsumption[i][indices[i]].schedules);
            }
            hourShiftSchedules.push(
                new HourShiftSchedules(indices, totalConsumption, schedules)
            );
        }

        hourShiftSchedules.sort((x, y) => {
            return x.totalConsumption - y.totalConsumption;
        });

        const answer = this.routine(hourShiftSchedules);
        return answer.map(deviceBatchSchedules => deviceBatchSchedules.toOutput());
    }
}

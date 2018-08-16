import {input} from './data';
import * as it from './InputData';
import {Output} from './OutputData';
import {isNullOrUndefined} from "util";
import {DeviceSchedule, DeviceBatchSchedule} from './DeviceSchedule';
import * as consts from './Constants';

class ScheduleIterator implements IterableIterator<DeviceBatchSchedule> {
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

class RatesAligner {
    public dayModeRateStartIdx: number = 0;
    public nightModeRateStartIdx: number = 0;
    private nightModeHour = 21 - 7;
    public readonly rateEdges: number[] = [];

    constructor(public rates: it.Rate[]) {
        this.alignRates();

        while (!(rates[this.nightModeRateStartIdx].from <= this.nightModeHour &&
                 this.nightModeHour < rates[this.nightModeRateStartIdx].to)) {
            this.nightModeRateStartIdx++;
        }

        for (let r of this.rates) {
            this.rateEdges.push(r.to);
        }
    }

    private alignRates() {
        const rates = this.rates;
        rates.sort((a, b) => a.from - b.from);

        let rateIdx = 0;
        while (rates[rateIdx].from < rates[rateIdx].to) {
            rateIdx++;
        }
        rates[rateIdx].to += consts.HOURS_PER_DAY;
        rateIdx++;
        while (rateIdx < rates.length) {
            rates[rateIdx].from += consts.HOURS_PER_DAY;
            rates[rateIdx].to += consts.HOURS_PER_DAY;
            rateIdx++;
        }

        for (let r of rates) {
            r.from -= consts.HOUR_MODE_SHIFT;
            r.to -= consts.HOUR_MODE_SHIFT;
        }

        while (rates[0].to < 0 && rates[0].from < 0) {
            const rateHead = rates[0];
            rateHead.from += consts.HOURS_PER_DAY;
            rateHead.to += consts.HOURS_PER_DAY;

            rates.push(rateHead);
            rates.shift();
        }

        if (rates[0].from < 0 && rates[0].to > 0) {
            const rateLast: it.Rate = {
                from: rates[rates.length - 1].to,
                to: consts.HOURS_PER_DAY,
                value: rates[0].value
            };
            rates[0].from = 0;
            rates.push(rateLast);
        }
    }

    public modePeriod(mode: string): [number, number, number] {
        switch (mode) {
            case "day":
                return [0, this.nightModeHour, this.dayModeRateStartIdx];

            case "night":
                return [this.nightModeHour, 24, this.nightModeRateStartIdx];

            case undefined:
                return [0, 24, this.dayModeRateStartIdx];
        }
    }
}

function solution(input: it.Input): Output {
    let ratesAligner = new RatesAligner(Object.assign([], input.rates));

    const allSchedules: DeviceSchedule[][] = [];

    for (let device of input.devices) {
        let [startHour, endHour, rateIdxStart] = ratesAligner.modePeriod(device.mode);

        const deviceSchedule: Array<DeviceSchedule> = [];

        let totalRate = 0.0;
        let deviceCurrentStartHour = startHour, deviceCurrentEndHour = startHour + device.duration;
        let rateIdxEnd = rateIdxStart;
        for (let i = deviceCurrentStartHour; i < deviceCurrentEndHour; i++) {
            if (i == ratesAligner.rateEdges[rateIdxEnd]) {
                rateIdxEnd++;
            }
            totalRate += ratesAligner.rates[rateIdxEnd].value * device.power;
        }
        const ds = new DeviceSchedule(device, totalRate, deviceCurrentStartHour);
        deviceSchedule.push(ds);

        while (deviceCurrentEndHour < endHour) {
            totalRate -= ratesAligner.rates[rateIdxStart].value * device.power;
            deviceCurrentStartHour++;
            deviceCurrentEndHour++;

            if (deviceCurrentStartHour == ratesAligner.rateEdges[rateIdxStart]) {
                rateIdxStart++;
            }
            if (deviceCurrentEndHour - 1 == ratesAligner.rateEdges[rateIdxEnd]) {
                rateIdxEnd++;
            }

            totalRate += ratesAligner.rates[rateIdxEnd].value * device.power;

            const ds = new DeviceSchedule(device, totalRate, deviceCurrentStartHour);
            deviceSchedule.push(ds);
        }

        allSchedules.push(deviceSchedule);
    }

    let scheduleOptimal: DeviceBatchSchedule = null;
    for (let schedule of new ScheduleIterator(allSchedules)) {
        if (schedule.isValid(input.maxPower) &&
           (isNullOrUndefined(scheduleOptimal) || scheduleOptimal.totalConsumption > schedule.totalConsumption)) {
            scheduleOptimal = schedule;
        }
    }

    for (let schedule of scheduleOptimal.devices) {
        schedule.hourStart += consts.HOUR_MODE_SHIFT;
    }

    return scheduleOptimal.toOutput();
}

const answer: Output = solution(input);
// console.log(answer);
console.log(JSON.stringify(answer, null, 2));

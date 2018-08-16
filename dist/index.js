"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data_1 = require("./data");
const util_1 = require("util");
const DeviceSchedule_1 = require("./DeviceSchedule");
const consts = require("./Constants");
class ScheduleIterator {
    constructor(deviceSchedules) {
        this.deviceSchedules = deviceSchedules;
        this.currentIndices = new Array(this.deviceSchedules.length).fill(0);
        this.hasNext = deviceSchedules.length > 0 && deviceSchedules.some(pt => pt.length > 0);
    }
    shiftIndices() {
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
    next() {
        if (!this.hasNext) {
            return {
                done: true,
                value: null,
            };
        }
        let deviceSchedules = this.currentIndices.map((scheduleIdx, deviceIdx) => {
            return this.deviceSchedules[deviceIdx][scheduleIdx];
        });
        let result = new DeviceSchedule_1.DeviceBatchSchedule(deviceSchedules);
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
    constructor(rates) {
        this.rates = rates;
        this.dayModeRateStartIdx = 0;
        this.nightModeRateStartIdx = 0;
        this.nightModeHour = 21 - 7;
        this.rateEdges = [];
        this.alignRates();
        while (!(rates[this.nightModeRateStartIdx].from <= this.nightModeHour &&
            this.nightModeHour < rates[this.nightModeRateStartIdx].to)) {
            this.nightModeRateStartIdx++;
        }
        for (let r of this.rates) {
            this.rateEdges.push(r.to);
        }
    }
    alignRates() {
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
        rates.map(r => {
            r.from -= consts.HOUR_MODE_SHIFT;
            r.to -= consts.HOUR_MODE_SHIFT;
        });
        while (rates[0].to < 0 && rates[0].from < 0) {
            const rateHead = rates[0];
            rateHead.from += consts.HOURS_PER_DAY;
            rateHead.to += consts.HOURS_PER_DAY;
            rates.push(rateHead);
            rates.shift();
        }
        if (rates[0].from < 0 && rates[0].to > 0) {
            const rateLast = {
                from: rates[rates.length - 1].to,
                to: consts.HOURS_PER_DAY,
                value: rates[0].value
            };
            rates[0].from = 0;
            rates.push(rateLast);
        }
    }
    modePeriod(mode) {
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
function solution(input) {
    let ratesAligner = new RatesAligner(Object.assign([], input.rates));
    const allSchedules = [];
    for (let device of input.devices) {
        let [startHour, endHour, rateIdxStart] = ratesAligner.modePeriod(device.mode);
        const deviceSchedule = [];
        let totalRate = 0.0;
        let deviceCurrentStartHour = startHour, deviceCurrentEndHour = startHour + device.duration;
        let rateIdxEnd = rateIdxStart;
        for (let i = deviceCurrentStartHour; i < deviceCurrentEndHour; i++) {
            if (i == ratesAligner.rateEdges[rateIdxEnd]) {
                rateIdxEnd++;
            }
            totalRate += ratesAligner.rates[rateIdxEnd].value * device.power;
        }
        const ds = new DeviceSchedule_1.DeviceSchedule(device, totalRate, deviceCurrentStartHour, deviceCurrentEndHour, 0);
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
            const ds = new DeviceSchedule_1.DeviceSchedule(device, totalRate, deviceCurrentStartHour, deviceCurrentEndHour, deviceCurrentStartHour - startHour);
            deviceSchedule.push(ds);
        }
        allSchedules.push(deviceSchedule);
    }
    let scheduleOptimal = null;
    for (let schedule of new ScheduleIterator(allSchedules)) {
        if (schedule.isValid(input.maxPower) &&
            (util_1.isNullOrUndefined(scheduleOptimal) || scheduleOptimal.totalConsumption > schedule.totalConsumption)) {
            scheduleOptimal = schedule;
        }
    }
    for (let schedule of scheduleOptimal.devices) {
        schedule.hourStart += consts.HOUR_MODE_SHIFT;
        schedule.hourEnd += consts.HOUR_MODE_SHIFT;
    }
    return scheduleOptimal.toOutput();
}
const answer = solution(data_1.input);
// console.log(answer);
console.log(JSON.stringify(answer, null, 2));
//# sourceMappingURL=Index.js.map
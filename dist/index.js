"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data_1 = require("./data");
const util_1 = require("util");
const DeviceSchedule_1 = require("./DeviceSchedule");
const consts = require("./Constants");
const ScheduleIterator_BruteForce_1 = require("./ScheduleIterator_BruteForce");
const RatesAligner_1 = require("./RatesAligner");
function computeAllSchedules(input) {
    let ratesAligner = new RatesAligner_1.RatesAligner(Object.assign([], input.rates));
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
        const ds = new DeviceSchedule_1.DeviceSchedule(device, totalRate, deviceCurrentStartHour);
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
            const ds = new DeviceSchedule_1.DeviceSchedule(device, totalRate, deviceCurrentStartHour);
            deviceSchedule.push(ds);
        }
        allSchedules.push(deviceSchedule);
    }
    return allSchedules;
}
function solution_bruteforce(allSchedules) {
    let scheduleOptimal = null;
    for (let schedule of new ScheduleIterator_BruteForce_1.ScheduleIterator_BruteForce(allSchedules)) {
        if (schedule.isValid(data_1.input.maxPower) &&
            (util_1.isNullOrUndefined(scheduleOptimal) || scheduleOptimal.totalConsumption > schedule.totalConsumption)) {
            scheduleOptimal = schedule;
        }
    }
    for (let schedule of scheduleOptimal.devices) {
        schedule.hourStart += consts.HOUR_MODE_SHIFT;
    }
    return scheduleOptimal;
}
const allSchedules = computeAllSchedules(data_1.input);
const answer = solution_bruteforce(allSchedules).toOutput();
// console.log(answer);
console.log(JSON.stringify(answer, null, 2));
//# sourceMappingURL=index.js.map
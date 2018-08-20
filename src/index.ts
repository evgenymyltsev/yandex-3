import {input} from './data';
import * as it from './InputData';
import {Output} from './OutputData';
import {isNullOrUndefined} from "util";
import {DeviceSchedule, DeviceBatchSchedule} from './DeviceSchedule';
import * as consts from './Constants';
import {ScheduleIterator_BruteForce} from './ScheduleIterator_BruteForce';
import {ScheduleIterator} from './ScheduleIterator';
import {RatesAligner} from './RatesAligner';

function computeAllSchedules(input: it.Input): DeviceSchedule[][] {
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

    return allSchedules;
}

function solution_bruteforce(allSchedules: DeviceSchedule[][]): DeviceBatchSchedule {
    const counter = Array.from(new ScheduleIterator_BruteForce(allSchedules)).length;
    console.log(counter);

    let scheduleOptimal: DeviceBatchSchedule = null;
    for (let schedule of new ScheduleIterator_BruteForce(allSchedules)) {
        if (schedule.isValid(input.maxPower) &&
           (isNullOrUndefined(scheduleOptimal) || scheduleOptimal.totalConsumption > schedule.totalConsumption)) {
            scheduleOptimal = schedule;
        }
    }

    for (let schedule of scheduleOptimal.devices) {
        schedule.hourStart += consts.HOUR_MODE_SHIFT;
    }

    return scheduleOptimal;
}

function solution(allSchedules: DeviceSchedule[][]): DeviceBatchSchedule {
    let scheduleOptimal: DeviceBatchSchedule = null;

    let iterator = new ScheduleIterator(allSchedules);
    for (let schedule of iterator) {
        if (schedule.isValid(input.maxPower)) {
            const isMinimum =
                isNullOrUndefined(scheduleOptimal) || scheduleOptimal.totalConsumption > schedule.totalConsumption;
            if (isMinimum) {
                scheduleOptimal = schedule;
                break;
            }
        }
    }

    for (let schedule of scheduleOptimal.devices) {
        schedule.hourStart += consts.HOUR_MODE_SHIFT;
    }

    return scheduleOptimal;
}

const allSchedules = computeAllSchedules(input);

console.time("bruteforce");
// const answer1: Output = solution_bruteforce(allSchedules).toOutput();
console.timeEnd("bruteforce");
// console.log(JSON.stringify(answer1, null, 2));

console.time("optimal");
const answer2: Output = solution(allSchedules).toOutput();
console.timeEnd("optimal");
// console.log(answer2);
// console.log(JSON.stringify(answer2, null, 2));

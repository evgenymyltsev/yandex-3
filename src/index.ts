import {input} from './data';
import * as it from './InputData';
import {Output} from './OutputData';
import {isNullOrUndefined} from "util";
import {DeviceSchedule, DeviceBatchSchedule} from './DeviceSchedule';
import * as consts from './Constants';
import {ScheduleIterator_BruteForce} from './ScheduleIterator_BruteForce';
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

const allSchedules = computeAllSchedules(input);

const answer: Output = solution_bruteforce(allSchedules).toOutput();
// console.log(answer);
console.log(JSON.stringify(answer, null, 2));

import * as inputData from "./InputData";
import {DeviceSchedule} from "./DeviceSchedule";
import {RatesAligner} from "./RatesAligner";
import * as _ from "lodash";

export function computeAllSchedules(input: inputData.Input): DeviceSchedule[][] {
    let ratesAligner = new RatesAligner(_.cloneDeep(input.rates));

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

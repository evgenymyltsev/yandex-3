import * as it from "./InputData";
import {Output} from "./OutputData";
import * as consts from './Constants';

export class DeviceSchedule {
    constructor(public device: it.Device, public totalRate: number,
                public hourStart: number, public hourEnd: number,
                public hourOffset: number) {}
}

export class DeviceBatchSchedule {
    public readonly totalConsumption: number;

    constructor(public devices: DeviceSchedule[]) {
        this.totalConsumption =
            devices.map(d => d.totalRate).reduce((a, b) => a + b);
    }

    public isValid(maxPower: number): boolean {
        let consumption =
            this.devices.map(d => [d.hourStart, d.device.power]);
        consumption = consumption.concat(this.devices.map(d => [d.hourEnd, -d.device.power]));
        consumption.sort((x, y) => x[0] - y[0]);

        let totalConsumption = 0;
        for (let i = 0; i < consumption.length; i++) {
            totalConsumption += consumption[i][1];
            if (totalConsumption > maxPower) {
                return false;
            }
        }
        return true;
    }

    toOutput(): Output {
        const output: Output = {
            schedule: {},
            consumedEnergy: {
                value: this.totalConsumption / 1000.,
                devices: {},
            }
        };

        for (let i = 0; i < consts.HOURS_PER_DAY; i++) {
            output.schedule[i] = [];
        }

        for (let deviceSchedule of this.devices) {
            output.consumedEnergy.devices[deviceSchedule.device.id] = deviceSchedule.totalRate / 1000.;

            for (let hour = deviceSchedule.hourStart; hour < deviceSchedule.hourEnd; hour++) {
                output.schedule[hour % consts.HOURS_PER_DAY].push(deviceSchedule.device.id);
            }
        }
        return output;
    }
}

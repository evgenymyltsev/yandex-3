"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const consts = require("./Constants");
class DeviceSchedule {
    constructor(device, totalRate, hourStart) {
        this.device = device;
        this.totalRate = totalRate;
        this.hourStart = hourStart;
    }
    hourEnd() {
        return this.hourStart + this.device.duration;
    }
}
exports.DeviceSchedule = DeviceSchedule;
class DeviceBatchSchedule {
    constructor(devices) {
        this.devices = devices;
        this.totalConsumption =
            devices.map(d => d.totalRate).reduce((a, b) => a + b);
    }
    isValid(maxPower) {
        let consumption = this.devices.map(d => [d.hourStart, d.device.power]);
        consumption = consumption.concat(this.devices.map(d => [d.hourEnd(), -d.device.power]));
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
    toOutput() {
        const output = {
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
            for (let hour = deviceSchedule.hourStart; hour < deviceSchedule.hourEnd(); hour++) {
                output.schedule[hour % consts.HOURS_PER_DAY].push(deviceSchedule.device.id);
            }
        }
        return output;
    }
}
exports.DeviceBatchSchedule = DeviceBatchSchedule;
//# sourceMappingURL=DeviceSchedule.js.map
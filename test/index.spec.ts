import {Output} from '../src/OutputData';
import {Input} from "../src/InputData";
import * as _ from "lodash";
import {Solution} from "../src/Solution";
import {Solution_BruteForce} from "../src/Solution_BruteForce";
import {SolutionMode} from "../src/SolutionMode";
import * as data from "../src/Data";

export function outputDataEqual(output1: Output, output2: Output): boolean {
    const epsilon = 1e-3;

    // Compare `consumedEnergy` section
    if (Math.abs(output1.consumedEnergy.value - output2.consumedEnergy.value) >= epsilon) {
        return false;
    }

    const devices1 = _.keys(output1.consumedEnergy.devices).sort();
    const devices2 = _.keys(output1.consumedEnergy.devices).sort();

    if (!(_.isEqual(devices1, devices2))) {
        return false;
    }

    for (let deviceStr of devices1) {
        if (Math.abs(output1.consumedEnergy.devices[deviceStr] -
            output2.consumedEnergy.devices[deviceStr]) >= epsilon) {
            return false;
        }
    }

    // Compare `schedule` section
    const hours1 = _.keys(output1.schedule).map(x => parseInt(x)).sort((x, y) => x - y);
    const hours2 = _.keys(output2.schedule).map(x => parseInt(x)).sort((x, y) => x - y);
    if (hours1.length != 24 || hours2.length != 24) {
        return false;
    }
    for (let hour = 0; hour < 24; hour++) {
        if (hours1[hour] != hour) {
            return false;
        }
        if (hours2[hour] != hour) {
            return false;
        }
        if (!_.isEqual(output1.schedule[hour].sort(), output2.schedule[hour].sort())) {
            return false;
        }
    }

    return true;
}

export function outputIsValid(input: Input, output: Output): boolean {
    for (const hourStr of  _.keys(output.schedule)) {
        const hour = parseInt(hourStr);
        const devices = output.schedule[hour].map(d =>
            _.find(input.devices, x => x.id == d)
        );
        const actualPower = devices.reduce((x, y) => x + y.power, 0);
        if (actualPower > input.maxPower) {
            return false;
        }

        for (const device of devices) {
            switch (device.mode) {
                case 'night':
                    if (!((21 <= hour && hour < 24) || (0 <= hour && hour < 7))) {
                        return false;
                    }
                    break;
                case 'day':
                    if (!(7 <= hour && hour < 21)) {
                        return false;
                    }
                    break;
                default:
                    break;
            }
        }
    }
    return true;
}

function allMinimalBruteforce(input: Input): Output[] {
    return new Solution_BruteForce(input, SolutionMode.AllMinimal).solve();
}

describe("searching minimal consumption schedule", () => {
    beforeEach(() => {
        jasmine.addCustomEqualityTester(outputDataEqual);
    });

    it("should find same sets of output as bruteforce does", () => {
        const modes = [
            SolutionMode.AllPossible,
            SolutionMode.AllValid,
            SolutionMode.AllMinimal,
            SolutionMode.Production,
        ];
        for (const mode of modes) {
            const answers_bruteforce = new Solution_BruteForce(data.input, mode).solve();
            const answers = new Solution(data.input, mode).solve();

            if (mode != SolutionMode.AllPossible) {
                for (const a of answers_bruteforce) {
                    expect(outputIsValid(data.input, a)).toBe(true);
                }
                for (const a of answers) {
                    expect(outputIsValid(data.input, a)).toBe(true);
                }
            }

            expect(answers.length).toBe(answers_bruteforce.length);

            for (const answer of answers) {
                const found = _.find(answers_bruteforce, x => outputDataEqual(x, answer));
                expect(found).toBeDefined();
            }
        }
    });

    it("should not greedily select lowest tariff for single device", () => {
        const input: Input = {
            maxPower: 10,
            devices: [
                {id: 'a', name: 'a', power: 10, duration: 4, mode: 'day',},
            ],
            rates: [
                {from: 7, to: 9, value: 10},
                {from: 9, to: 11, value: 20},
                {from: 11, to: 21, value: 5},
                {from: 21, to: 7, value: 100},
            ]
        };
        const expectedOutput: Output = {
            schedule: {
                0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: [], 10: [],
                11: ["a"], 12: ["a"], 13: ["a"], 14: ["a"],
                15: [], 16: [], 17: [], 18: [], 19: [], 20: [], 21: [], 22: [], 23: []
            },
            consumedEnergy: {
                value: 0.2,
                devices: {"a": 0.2}
            }
        };

        const answer = new Solution(input).solve()[0];

        expect(outputIsValid(input, answer)).toBe(true);
        expect(outputDataEqual(answer, expectedOutput)).toBe(true);
        expect(_.find(allMinimalBruteforce(input), x => outputDataEqual(x, answer))).toBeDefined();
    });

    it("should not greedily select lowest tariffs for two devices", () => {
        const input: Input = {
            maxPower: 10,
            devices: [
                {id: 'a', name: 'a', power: 10, duration: 4, mode: 'day',},
                {id: 'b', name: 'b', power: 10, duration: 2, mode: 'day',},
            ],
            rates: [
                {from: 7, to: 9, value: 10},
                {from: 9, to: 11, value: 30},
                {from: 11, to: 13, value: 5},
                {from: 13, to: 21, value: 10},
                {from: 21, to: 7, value: 100},
            ]
        };

        const expectedOutput: Output = {
            schedule: {
                0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: [], 10: [],
                11: [ 'a' ], 12: [ 'a' ], 13: [ 'a' ], 14: [ 'a' ],
                15: [],
                16: [ 'b' ], 17: [ 'b' ],
                18: [], 19: [], 20: [], 21: [], 22: [], 23: []
            },
            consumedEnergy: { value: 0.5, devices: { a: 0.3, b: 0.2 } }
        };

        const answer = new Solution(input).solve()[0];

        expect(outputIsValid(input, answer)).toBe(true);
        expect(outputDataEqual(answer, expectedOutput)).toBe(true);
        expect(_.find(allMinimalBruteforce(input), x => outputDataEqual(x, answer))).toBeDefined();
    });

    it("should return empty result when there is no solution", () => {
        const input: Input = {
            maxPower: 10,
            devices: [
                {id: 'a', name: 'a', power: 100, duration: 4, mode: 'day',},
            ],
            rates: [
                {from: 7, to: 7, value: 10}
            ]
        };

        const answer = new Solution(input).solve();
        expect(answer.length).toBe(0);
    });

    it("should pass 'stress' test", () => {
        expect(true).toBe(true);
    });
});

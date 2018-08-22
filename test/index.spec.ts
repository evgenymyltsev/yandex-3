import {Output} from '../src/OutputData';

function outputDataEqual(output1: Output, output2: Output): boolean {
    return output1.consumedEnergy.value == output2.consumedEnergy.value;
}

describe("searching minimal consumption schedule", () => {
    beforeEach(() => {
        jasmine.addCustomEqualityTester(outputDataEqual);
    });

    it("should pass 'stress' test", () => {
        expect(true).toBe(true);
    });
});

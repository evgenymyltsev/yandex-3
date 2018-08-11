import {input} from './data';
import {Input} from './InputData';
import {Output} from './OutputData';

function solution(input: Input): Output {
    console.log(input.maxPower);

    for (const device of input.devices) {
        console.log(device.mode);
    }

    for (const rate of input.rates) {
        console.log(rate.value);
    }

    const output = new Output();
    return output;
}

solution(input);

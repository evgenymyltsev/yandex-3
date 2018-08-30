import * as data from './data';
import {Output} from './OutputData';
import {Solution} from "./Solution";
import {Solution_BruteForce} from "./Solution_BruteForce";

function main() {
    console.time("bruteforce");
    const answer_bruteforce: Output[] = new Solution_BruteForce(data.input).solve();
    console.timeEnd("bruteforce");
    // console.log(JSON.stringify(answer_bruteforce, null, 2));

    console.time("optimal");
    const answer_optimal: Output[] = new Solution(data.input).solve();
    console.timeEnd("optimal");
    // console.log(answer_optimal);
    console.log(JSON.stringify(answer_optimal, null, 2));
}

main();

import * as it from "./InputData";
import * as consts from "./Constants";

export class RatesAligner {
    private readonly dayModeRateStartIdx: number = 0;
    private readonly nightModeRateStartIdx: number = 0;
    private readonly nightModeHour = 21 - 7;
    private readonly _rateEdges: number[] = [];

    get rateEdges(): number[] {
        return this._rateEdges;
    }

    constructor(public rates: it.Rate[]) {
        this.alignRates();

        while (!(rates[this.nightModeRateStartIdx].from <= this.nightModeHour &&
            this.nightModeHour < rates[this.nightModeRateStartIdx].to)) {
            this.nightModeRateStartIdx++;
        }

        for (let r of this.rates) {
            this._rateEdges.push(r.to);
        }
    }

    private alignRates() {
        const rates = this.rates;
        rates.sort((a, b) => a.from - b.from);

        let rateIdx = 0;
        while (rates[rateIdx].from < rates[rateIdx].to) {
            rateIdx++;
        }
        rates[rateIdx].to += consts.HOURS_PER_DAY;
        rateIdx++;
        while (rateIdx < rates.length) {
            rates[rateIdx].from += consts.HOURS_PER_DAY;
            rates[rateIdx].to += consts.HOURS_PER_DAY;
            rateIdx++;
        }

        for (let r of rates) {
            r.from -= consts.HOUR_MODE_SHIFT;
            r.to -= consts.HOUR_MODE_SHIFT;
        }

        while (rates[0].to < 0 && rates[0].from < 0) {
            const rateHead = rates[0];
            rateHead.from += consts.HOURS_PER_DAY;
            rateHead.to += consts.HOURS_PER_DAY;

            rates.push(rateHead);
            rates.shift();
        }

        if (rates[0].from < 0 && rates[0].to > 0) {
            const rateLast: it.Rate = {
                from: rates[rates.length - 1].to,
                to: consts.HOURS_PER_DAY,
                value: rates[0].value
            };
            rates[0].from = 0;
            rates.push(rateLast);
        }
    }

    public modePeriod(mode: string): [number, number, number] {
        switch (mode) {
            case "day":
                return [0, this.nightModeHour, this.dayModeRateStartIdx];

            case "night":
                return [this.nightModeHour, 24, this.nightModeRateStartIdx];

            case undefined:
                return [0, 24, this.dayModeRateStartIdx];
        }
    }
}

class Schedule {
    hour: number;
    deviceIds: string[];
}

class ConsumedEnergy {
    value: number;
}

export class Output {
    schedule: Schedule;
    consumedEnergy: ConsumedEnergy;
}

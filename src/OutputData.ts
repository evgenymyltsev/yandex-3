interface ConsumedEnergy {
    value: number,
    devices: { [id: string]: number }
}

export interface Output {
    schedule: { [hour: number]: string[] },
    consumedEnergy: ConsumedEnergy,
}

interface Device {
    id: String,
    name: String,
    power: number,
    duration: number,
    mode?: String,
}

interface Rate {
    from: number,
    to: number,
    value: number,
}

export interface Input {
    maxPower: number,
    devices: Device[],
    rates: Rate[],
}

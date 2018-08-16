export interface Device {
    id: string,
    name: string,
    power: number,
    duration: number,
    mode?: string,
}

export interface Rate {
    from: number,
    to: number,
    value: number,
}

export interface Input {
    maxPower: number,
    devices: Device[],
    rates: Rate[],
}

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ReactNode } from "react";

export const name = 'logsReducer'

export const logsSelector = (state: any): LogsState => state[name]

export type LogEntity = {
  dateTime: string
  logKey: number
  message: ReactNode
}
export type LogsState = {
  logs: LogEntity[]
  logKnownEvents: boolean
  rotatePortsView: boolean
  echoReceived: boolean
  logKey: number
  ports: {
    ra0?: boolean
    ra1?: boolean
    ra2?: boolean
    ra3?: boolean
    ra4?: boolean
    rb0?: boolean
    rb1?: boolean
    rb2?: boolean
    rb3?: boolean
    rb4?: boolean
    rb5?: boolean
    rb7?: boolean
    rb8?: boolean
    rb9?: boolean
    rb10?: boolean
    rb11?: boolean
    rb13?: boolean
    rb14?: boolean
    rb15?: boolean

    MCLR?: undefined
    VSS?: undefined
    VDD?: undefined

    Vbus?: undefined
    AVdd?: undefined
    AVss?: undefined
    Vcap?: undefined
    Vusb?: undefined
  },
  globalState: {
    spiAddr?: number
    spiTask?: number
    initialTasks?: number

    buttonIn?: boolean
    capotIn?: boolean
    immoSenceIn?: boolean
    asr12VIn?: boolean

    buttonTest?: number
    capotTest?: number
    immoSenceTest?: number
    asr12VTest?: number

    ms10?: number
    min?: number
    hour?: number

    immoState?: number
  },
}

const initialState: LogsState = {
  logs: [],
  logKey: 0,
  logKnownEvents: false,
  rotatePortsView: false,
  ports: {},
  echoReceived: false,
  globalState: {},
}

const logsReducer = createSlice({
  name,
  initialState,
  reducers: {
    log: (state, { payload: { message, isError } }: PayloadAction<{ message: ReactNode, isError?: boolean }>) => {
      state.logs.unshift({
        logKey: state.logKey++,
        dateTime: new Date().toISOString(),
        message: isError ? <>ERROR: {message}</> : message,
      })
    },
    clearLog: (state) => {
      state.logs.splice(0)
    },
    setPins: (state, { payload: ports }: PayloadAction<number[]>) => {
      // In firmware ports are sent as
      // memcpy (out, &PORTA, 4);
      // memcpy (&out[4], &PORTB, 4);
      state.ports.ra0 = !!(ports[3] & 0b1);
      state.ports.ra1 = !!(ports[3] & 0b10);
      state.ports.ra2 = !!(ports[3] & 0b100);
      state.ports.ra3 = !!(ports[3] & 0b1000);
      state.ports.ra4 = !!(ports[3] & 0b10000);

      state.ports.rb0 = !!(ports[7] & 0b1);
      state.ports.rb1 = !!(ports[7] & 0b10);
      state.ports.rb2 = !!(ports[7] & 0b100);
      state.ports.rb3 = !!(ports[7] & 0b1000);
      state.ports.rb4 = !!(ports[7] & 0b10000);
      state.ports.rb5 = !!(ports[7] & 0b100000);

      state.ports.rb7 = !!(ports[7] & 0b10000000);
      state.ports.rb8 = !!(ports[6] & 0b1);
      state.ports.rb9 = !!(ports[6] & 0b10);
      state.ports.rb10 = !!(ports[6] & 0b100);
      state.ports.rb11 = !!(ports[6] & 0b1000);

      state.ports.rb13 = !!(ports[6] & 0b100000);
      state.ports.rb14 = !!(ports[6] & 0b1000000);
      state.ports.rb15 = !!(ports[6] & 0b10000000);

    },
    setGlobalState: (state, { payload }: PayloadAction<LogsState['globalState']>) => {
      state.globalState = payload
    },
    toggleLogKnownEvents: (state) => {
      state.logKnownEvents = !state.logKnownEvents
    },
    toggleRotatePortsView: (state) => {
      state.rotatePortsView = !state.rotatePortsView
    },
    setEchoReceived: (state, { payload }: PayloadAction<boolean>) => {
      state.echoReceived = payload
    },
  },
})

export const {
  log,
  clearLog,
  setPins,
  toggleLogKnownEvents,
  toggleRotatePortsView,
  setEchoReceived,
  setGlobalState,
} = logsReducer.actions

export default logsReducer.reducer
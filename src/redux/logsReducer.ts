import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { USBFeatureResponses } from "../usb/usbFeatureRequests";

export const name = 'logsReducer'

const logsSelector = (state: any): LogsState => state[name]

export type LogEntity = {
  dateTime: string
  message: string
}
export type LogsState = {
  logs: LogEntity[]
  logKnownEvents: boolean
  rotatePortsView: boolean
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
  }
}

const initialState: LogsState = {
  logs: [],
  logKnownEvents: false,
  rotatePortsView: false,
  ports: {},
}

const knownEvents = {
  [USBFeatureResponses.USB_POST_PORTS_STATE]: true,
}

export const processUsbEvent = createAsyncThunk<void, HIDInputReportEvent>(
  `${name}/processUsbEventAction`,
  (event, { getState, dispatch }) => {
    const usbEventId: keyof typeof knownEvents = event.data.getUint8(0);
    switch (usbEventId) {
      case USBFeatureResponses.USB_POST_PORTS_STATE:
        dispatch(setPins(new Array(9).fill(0).map((_, i) => event.data.getUint8(i)).slice(1)))
        break
    }
    if (logsSelector(getState()).logKnownEvents || !knownEvents[usbEventId]) {
      dispatch(log({
        message: `RId: ${event.reportId}, L: ${event.data.byteLength}, Data: `
          + new Array(event.data.byteLength).fill(0).map((_, i) => event.data.getUint8(i).toString(16)).join(' '),
      }))
    }
  })

const logsReducer = createSlice({
  name,
  initialState,
  reducers: {
    log: (state, { payload: { message, isError } }: PayloadAction<{ message: string, isError?: boolean }>) => {
      state.logs.unshift({
        dateTime: new Date().toISOString(),
        message: isError ? `ERROR: ${message}` : message,
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
    toggleLogKnownEvents: (state) => {
      state.logKnownEvents = !state.logKnownEvents
    },
    toggleRotatePortsView: (state) => {
      state.rotatePortsView = !state.rotatePortsView
    },
  },
})

export const {
  log,
  clearLog,
  setPins,
  toggleLogKnownEvents,
  toggleRotatePortsView,
} = logsReducer.actions

export default logsReducer.reducer
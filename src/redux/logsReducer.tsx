import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ReactNode } from "react";
import { SPICommand, USBFeatureResponses } from "../usb/usbFeatureRequests";
import { setStatusReg } from "./spiReducer";

export const name = 'logsReducer'

const logsSelector = (state: any): LogsState => state[name]

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
  }
}

const initialState: LogsState = {
  logs: [],
  logKey: 0,
  logKnownEvents: false,
  rotatePortsView: false,
  ports: {},
  echoReceived: false,
}

const knownSpiCommands: { [key in SPICommand]?: boolean } = {
  [SPICommand.StatusRegRead]: true,
  [SPICommand.WriteDisable]: true,
  [SPICommand.WriteEnable]: true,
}

const knownEvents = {
  [USBFeatureResponses.USB_POST_PORTS_STATE]: () => true,
  [USBFeatureResponses.USB_ECHO]: () => true,
  [USBFeatureResponses.USB_POST_SPI_RESP]: (usbData: SPICommand) => knownSpiCommands[usbData],
  [USBFeatureResponses.USB_GOT_BEAN_CMD]: () => true,
  [USBFeatureResponses.USB_GOT_REC_TICKS]: () => true,
}

export const processUsbEvent = createAsyncThunk<void, HIDInputReportEvent>(
  `${name}/processUsbEventAction`,
  (event, { getState, dispatch }) => {
    const usbEventId: keyof typeof knownEvents = event.data.getUint8(0);
    switch (usbEventId) {
      case USBFeatureResponses.USB_POST_PORTS_STATE:
        dispatch(setPins(new Array(9).fill(0).map((_, i) => event.data.getUint8(i)).slice(1)))
        break
      case USBFeatureResponses.USB_ECHO:
        dispatch(setEchoReceived(true))
        setTimeout(() => dispatch(setEchoReceived(false)), 1000)
        break
      case USBFeatureResponses.USB_GOT_BEAN_CMD:
        dispatch(
          log({
            message: 'BEAN received: '
              // Always display full bean command received as it may be erroneoues, so cannot relate on command length in first byte
              + (new Array(17)).fill(0)
                .map((_, i) => event.data.getUint8(i + 1).toString(16).toUpperCase())
                .join(' '),
          }))
        break
      case USBFeatureResponses.USB_GOT_REC_TICKS: {
        // Format:
        // For each pulse on BEAN 2 bytes are received:
        //  - 1st byte: 0bBccccccc
        //    where B - is prev BEAN state, c is cnt count, or number of bits received, 1 - 6
        //  - 2nd byte: 0brrrrrrrr
        //    where r - is remainder from cnt calc.
        //    cnt = TMR / T_CNT + (reminder > (3/4 * T_CNT) ? 1 : 0)
        //    reminder = TMR - (CNT * T_CNT)
        //    See getCntFromTmr from recBEAN in bean repo
        dispatch(
          log({
            message: <span>
              {new Array(event.data.byteLength).fill(0).map((_, i) => {
                // event.data.getUint8(i) is command
                if (i === 0) return <></>
                const d = event.data.getUint8(i)
                if (i % 2 === 1) {
                  const bean = !!(d & 0b10000000)
                  const cnt = d & 0b01111111
                  return bean
                    ? <b style={{ color: 'green' }}>{cnt}</b>
                    : <b style={{ color: 'red' }}>{cnt}</b>
                }
                else return <>-{d.toString(16)}{' '}</>
              })}
            </span>,
          }))
        break
      }
      case USBFeatureResponses.USB_POST_SPI_RESP: {
        // SPI response format: |USB cmd|SPI rec: 2 bytes|SPI Sent cmd|
        const spiCommand: SPICommand = event.data.getUint8(9);
        switch (spiCommand) {
          case SPICommand.StatusRegRead:
            dispatch(setStatusReg(event.data.getUint8(2)))
            break
        }
        break
      }
    }
    if (logsSelector(getState()).logKnownEvents
      || !knownEvents[usbEventId]
      || !knownEvents[usbEventId](event.data.getUint8(9))) {
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
} = logsReducer.actions

export default logsReducer.reducer
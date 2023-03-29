import {  createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { addZeroesToArr } from "../helpers/addZeroesToAddr";
import { stringToByteArr } from "../helpers/stringToByteArr";
import { USBFeatureRequests } from "../usb/usbFeatureRequests";
import useUsbSendFeatureRequest from "../usb/useUsbSendFeatureRequest";
import { RootState } from "./store";

export const name = 'spiReducer'

export const spiSelector = (state: any): SPIState => state[name]

export enum SPILogCmd {
  LOG_ENTRY_RESET = 0x0,    // When device has been reset
  LOG_ENTRY_STATE_CHANGE = 0x1,
}

export type SPIState = {
  cmd: string
  addr: string
  data: string
  statusReg: {
    _RDY?: boolean
    WEN?: boolean
    BP0?: boolean
    BP1?: boolean
    BP2?: boolean
    SRWP?: boolean
  },

  // [address, hour, min, sec, ms, SPILogCmd, data, data, data]
  spiLog: [string, number, number, number, number, SPILogCmd, number, number, number][]
  isReadingSpiLog: boolean
  startAddr: string
  endAddr: string

  // We receive first byte, than second byte.
  isAddToSpiLogFirstByte: boolean
}

const initialState: SPIState = {
  cmd: '',
  addr: '',
  data: '',
  statusReg: {},

  spiLog: [],
  isReadingSpiLog: false,
  startAddr: '',
  endAddr: '',
  isAddToSpiLogFirstByte: false,
}

const timeout = () => new Promise((resolve) => setTimeout(resolve, 20))

export const readSpiLog = createAsyncThunk<
  void,
  { sendUsbReq: ReturnType<typeof useUsbSendFeatureRequest> }
>(
  'readSpiLog',
  async ({ sendUsbReq }, { signal, getState, dispatch }) => {
    let startAddrStr = (getState() as RootState).spiReducer.startAddr
    const endAddrStr = (getState() as RootState).spiReducer.endAddr

    let startAddr = isNaN(parseInt(startAddrStr, 16)) ? 0 : Math.floor(parseInt(startAddrStr, 16) / 8) * 8
    const endAddr = isNaN(parseInt(endAddrStr, 16)) ? 0 : Math.floor(parseInt(endAddrStr, 16) / 8) * 8

    if (startAddr > endAddr && endAddr > 0) return
    while(!signal.aborted
      && (startAddr <= endAddr
        || (endAddr === 0 && startAddr <= 0x7FFFF))) {
      const spiLog = (getState() as RootState).spiReducer.spiLog
      if (Array.isArray(spiLog[0])
        && spiLog[0].slice(1).join('').toUpperCase() === '255255655350255255255255'
        && endAddr === 0) break;

      // Read always 8 bytes. 4 bytes - time, 4 bytes - data
      let readAddr = stringToByteArr(`000000${startAddr.toString(16)}`.slice(-6))

      await sendUsbReq(USBFeatureRequests.USB_SPI_SEND_CMD, undefined, [0x03, ...addZeroesToArr(readAddr.slice(0, 3), 3)])
      await timeout()
      startAddr += 4;

      readAddr = stringToByteArr(`000000${startAddr.toString(16)}`.slice(-6))
      await sendUsbReq(USBFeatureRequests.USB_SPI_SEND_CMD, undefined, [0x03, ...addZeroesToArr(readAddr.slice(0, 3), 3)])
      await timeout()

      startAddr += 4;
      dispatch(spiReducer.actions.setStartAddr(`000000${startAddr.toString(16)}`.slice(-6)))
    }
  }
)

const spiReducer = createSlice({
  name,
  initialState,
  reducers: {
    setSpiCmd: (state, { payload }: PayloadAction<string>) => {
      state.cmd = payload
    },
    setSpiAddr: (state, { payload }: PayloadAction<string>) => {
      if (payload.length <= 6) state.addr = payload
    },
    setSpiData: (state, { payload }: PayloadAction<string>) => {
      if (payload.length <= 8) state.data = payload
    },
    setStatusReg: (state, { payload }: PayloadAction<number>) => {
      state.statusReg._RDY = !!(payload & 0b1);
      state.statusReg.WEN = !!(payload & 0b10);
      state.statusReg.BP0 = !!(payload & 0b100);
      state.statusReg.BP1 = !!(payload & 0b1000);
      state.statusReg.BP2 = !!(payload & 0b10000);
      state.statusReg.SRWP = !!(payload & 0b10000000);
    },
    addToSpiLog: (state, { payload }: PayloadAction<[number, number, number, number]>) => {
      if (!state.isAddToSpiLogFirstByte) {
        const [hour, min, hms10, ms10] = payload
        const ms = ((hms10 << 8) + ms10) * 10;
        const sec = Math.floor(ms / 1000)
        state.spiLog.unshift([state.startAddr, hour, min, sec, ms - (sec * 1000), 0xFF, 0xFF, 0xFF, 0xFF])
      }
      else {
        state.spiLog[0][5] = payload[0]
        state.spiLog[0][6] = payload[1]
        state.spiLog[0][7] = payload[2]
        state.spiLog[0][8] = payload[3]
      }
      state.isAddToSpiLogFirstByte = !state.isAddToSpiLogFirstByte
    },
    clearSpiLog: (state) => {
      state.spiLog = []
      state.isAddToSpiLogFirstByte = false
    },
    setStartAddr: (state, { payload }: PayloadAction<string>) => {
      state.startAddr = payload
    },
    setEndAddr: (state, { payload }: PayloadAction<string>) => {
      state.endAddr = payload
    },
  },
  extraReducers: ({ addCase }) => {
    addCase(readSpiLog.pending, (state) => {
      state.isReadingSpiLog = true
    })
    addCase(readSpiLog.fulfilled, (state) => {
      state.isReadingSpiLog = false
    })
    addCase(readSpiLog.rejected, (state) => {
      state.isReadingSpiLog = false
    })
  },
})

export const {
  setSpiCmd,
  setStatusReg,
  setSpiAddr,
  setSpiData,

  addToSpiLog,
  clearSpiLog,
  setStartAddr,
  setEndAddr,
} = spiReducer.actions

export default spiReducer.reducer
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { removeNonHexChars } from "../helpers/stringToByteArr";
import { USBFeatureRequests } from "../usb/usbFeatureRequests";
import { handleUsbSendFeatureRequest } from "../usb/useUsbSendFeatureRequest";
import beanCmdSelector from "../selectors/beanCmdAsArrSelector";
import { RootState } from "./store";

export const name = 'beanReducer'

export type BeanState = {
  beanCmd: string
  cmdType: 'singleCmd' | 'multiCmd' | 'tickCount'
  sendCmdWoListern: boolean;
  minDelayMs: number // If more than 1 - means send continiously
  repeatCnt: number

  commands: { [cmd: string]: { cmdArr: number[], count: number } }
}

const initialState: BeanState = {
  beanCmd: '',
  cmdType: 'singleCmd',
  sendCmdWoListern: true,
  minDelayMs: 2000,
  repeatCnt: 10,

  commands: {},
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const sendBeanCmd = createAsyncThunk<
  void,
  { device: HIDDevice },
  { state: RootState }
>(
  'bean/sendBeanCmd',
  async ({ device }, { getState, dispatch, signal }) => {
    const { cmdType, sendCmdWoListern, minDelayMs, repeatCnt } = getState().beanReducer
    const beanCmd = beanCmdSelector(getState())
    const cmd = cmdType === 'tickCount'
      ? USBFeatureRequests.USB_SEND_BEAN_CMD_REC_TICKS
      : sendCmdWoListern
        ? USBFeatureRequests.USB_SEND_BEAN_CMD_WO_LISTERN
        : USBFeatureRequests.USB_SEND_BEAN_CMD;

    if (cmdType === 'tickCount' || cmdType === 'singleCmd') {
      handleUsbSendFeatureRequest(dispatch, device)(cmd, undefined, beanCmd)
    }
    else {
      for (let i = repeatCnt; i > 0; i--) {
        handleUsbSendFeatureRequest(dispatch, device)(cmd, undefined, beanCmd)
        if (signal.aborted) break
        await sleep(minDelayMs)
        if (signal.aborted) break
      }
    }
  }
)

const beanReducer = createSlice({
  name,
  initialState,
  reducers: {
    setBean: (state, { payload }: PayloadAction<string>) => {
      state.beanCmd = removeNonHexChars(payload)
    },
    setCmdType: (state, { payload }: PayloadAction<BeanState['cmdType']>) => {
      if (payload === 'tickCount') state.sendCmdWoListern = false;
      state.cmdType = payload
    },
    toggleSemdCmdWoListern: (state) => {
      if (state.cmdType === 'tickCount') state.sendCmdWoListern = false
      else state.sendCmdWoListern = !state.sendCmdWoListern;
    },
    setMinDelayMs: (state, { payload }: PayloadAction<number>) => {
      state.minDelayMs = payload
    },
    setRepeatCnt: (state, { payload }: PayloadAction<number>) => {
      state.repeatCnt = payload
    },

    addCommand: (state, { payload }: PayloadAction<number[]>) => {
      const ml = (payload[0] & 0x0F) + 3;
      const cmd = payload
          .map((b) => `0${b.toString(16)}`.slice(-2))
          .slice(0, ml)
          .join('')

      console.log('payload ', payload, ' cmd ', cmd, ' ml ', ml)

      if (!state.commands[cmd]) {
        state.commands[cmd] = {
          cmdArr: payload,
          count: 1,
        }
      }
      else state.commands[cmd].count += 1
    },
    clearCommands: (state) => {
      state.commands = {}
    },
  },
})

export const {
  setBean,
  setCmdType,
  toggleSemdCmdWoListern,
  setMinDelayMs,
  setRepeatCnt,

  addCommand,
  clearCommands,
} = beanReducer.actions

export default beanReducer.reducer
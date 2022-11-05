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
  minDelayMs: number // If more than 1 - means send continiously
  repeatCnt: number
}

const initialState: BeanState = {
  beanCmd: '',
  cmdType: 'singleCmd',
  minDelayMs: 200,
  repeatCnt: 10,
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const sendBeanCmd = createAsyncThunk<
  void,
  { device: HIDDevice },
  { state: RootState }
>(
  'bean/sendBeanCmd',
  async ({ device }, { getState, dispatch, signal }) => {
    const { cmdType, minDelayMs, repeatCnt } = getState().beanReducer
    const beanCmd = beanCmdSelector(getState())
    if (cmdType === 'tickCount' || cmdType === 'singleCmd') {
      handleUsbSendFeatureRequest(dispatch, device)
        (cmdType === 'tickCount' ? USBFeatureRequests.USB_SEND_BEAN_CMD_REC_TICKS : USBFeatureRequests.USB_SEND_BEAN_CMD, undefined, beanCmd)
    }
    else {
      for (let i = repeatCnt; i > 0; i--) {
        handleUsbSendFeatureRequest(dispatch, device)(USBFeatureRequests.USB_SEND_BEAN_CMD, undefined, beanCmd)
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
      state.cmdType = payload
    },
    setMinDelayMs: (state, { payload }: PayloadAction<number>) => {
      state.minDelayMs = payload
    },
    setRepeatCnt: (state, { payload }: PayloadAction<number>) => {
      state.repeatCnt = payload
    },
  },
})

export const {
  setBean,
  setCmdType,
  setMinDelayMs,
  setRepeatCnt,
} = beanReducer.actions

export default beanReducer.reducer
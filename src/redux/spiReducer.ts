import {  createSlice, PayloadAction } from "@reduxjs/toolkit";

export const name = 'spiReducer'

export const spiSelector = (state: any): SPIState => state[name]

export type SPIState = {
  cmd: string
  statusReg: {
    _RDY?: boolean
    WEN?: boolean
    BP0?: boolean
    BP1?: boolean
    BP2?: boolean
    SRWP?: boolean
  }
}

const initialState: SPIState = {
  cmd: '',
  statusReg: {},
}

const spiReducer = createSlice({
  name,
  initialState,
  reducers: {
    setSpiCmd: (state, { payload }: PayloadAction<string>) => {
      state.cmd = payload
    },
    setStatusReg: (state, { payload }: PayloadAction<number>) => {
      state.statusReg._RDY = !!(payload & 0b1);
      state.statusReg.WEN = !!(payload & 0b10);
      state.statusReg.BP0 = !!(payload & 0b100);
      state.statusReg.BP1 = !!(payload & 0b1000);
      state.statusReg.BP2 = !!(payload & 0b10000);
      state.statusReg.SRWP = !!(payload & 0b10000000);
    },
  },
})

export const {
  setSpiCmd,
  setStatusReg,
} = spiReducer.actions

export default spiReducer.reducer
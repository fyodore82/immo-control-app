import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export const name = 'logsReducer'

export type LogEntity = {
  dateTime: string
  message: string
}
export type LogsState = LogEntity[]

const initialState: LogsState = []

const logsReducer = createSlice({
  name,
  initialState,
  reducers: {
    log: (state, { payload: { message, isError } }: PayloadAction<{ message: string, isError?: boolean }>) => {
      state.push({
        dateTime: new Date().toISOString(),
        message: isError ? `ERROR: ${message}` : message,
      })
    },
  },
})

export const {
  log
} = logsReducer.actions

export default logsReducer.reducer
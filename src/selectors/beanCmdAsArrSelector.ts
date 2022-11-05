import { createSelector } from "@reduxjs/toolkit";
import Crc8 from "../helpers/calcCrc8";
import { stringToByteArr } from "../helpers/stringToByteArr";
import { RootState } from "../redux/store";

const beanCmdAsArrSelector = createSelector([
  (state: RootState) => state.beanReducer.beanCmd
], (beanCmd) => {
  const newBeanArr = stringToByteArr(beanCmd)
  const length = newBeanArr.length - 1
  newBeanArr[0] = (newBeanArr[0] & 0xF0) + length
  newBeanArr.push(Crc8(newBeanArr))
  return newBeanArr
})

export default beanCmdAsArrSelector

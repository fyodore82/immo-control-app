import { FormHelperText, FormLabel, TextField } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { createSelector } from '@reduxjs/toolkit';
import { FC } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { removeNonHexChars, stringToByteArr } from '../helpers/stringToByteArr';
import { setSpiAddr, setSpiCmd, setSpiData } from '../redux/spiReducer';
import { RootState } from '../redux/store';
import { SPICommand, USBFeatureRequests } from '../usb/usbFeatureRequests';
import useUsbSendFeatureRequest from '../usb/useUsbSendFeatureRequest'
import Port from './Port'

type Props = {
  device: HIDDevice | undefined
}

const statusRegBits: (keyof RootState['spiReducer']['statusReg'])[] = [
  '_RDY',
  'WEN',
  'BP0',
  'BP1',
  'BP2',
  'SRWP',
]

const numArrTox16StrArr = (arr: number[]) => arr.map((val) => val.toString(16).toUpperCase())
const addZeroesToArr = (arr: number[], zCnt: number) => {
  // Fill byteArr with 0 up to zCnt bytes
  // OR remove bytes that are more than zCnt
  const st = Math.min(arr.length, zCnt)
  const del = Math.max(0, arr.length - zCnt)
  const add = Math.max(0, zCnt - arr.length)
  arr.splice(st, del, ...(new Array(add).fill(0)))
  return arr
}

const selector = createSelector([
  (state: RootState) => state.spiReducer.cmd,
  (state: RootState) => state.spiReducer.statusReg,
  (state: RootState) => state.spiReducer.addr,
  (state: RootState) => state.spiReducer.data,
], (cmd, statusReg, addr, data) => {
  const addrArr = stringToByteArr(addr)
  const dataArr = stringToByteArr(data)
  const byteArr = stringToByteArr(cmd)
  return {
    cmd,
    addr,
    data,
    byteArr: addZeroesToArr(byteArr, 8),
    dataArr,
    statusReg,
    readCmdToSend: [0x03, ...addZeroesToArr(addrArr.slice(0, 3), 3)],
    writeCmdToSend: [
      0x02,
      ...addZeroesToArr(addrArr.slice(0, 3), 3),
      ...addZeroesToArr(dataArr.slice(0, 4), 4),
    ],
    smallSectorEraseCmdToSend: [0xD7, addrArr[0] || 0, (addrArr[1] || 0) & 0b11110000, 0x00],
  }
})

const SPIDebugTab: FC<Props> = ({ device }) => {
  const handleSendTestRequest = useUsbSendFeatureRequest(device)
  const dispatch = useDispatch()
  const {
    cmd,
    addr,
    data,
    readCmdToSend,
    writeCmdToSend,
    statusReg,
    byteArr,
    smallSectorEraseCmdToSend,
  } = useSelector(selector)

  return (
    <Box display='flex' flex={1}>
      <Box display='flex' flex={1} flexDirection='column'>
        <Box display='flex' sx={{ marginBottom: 1 }}>
          <TextField
            label='SPI Command'
            value={cmd}
            onChange={(event) => dispatch(setSpiCmd(removeNonHexChars(event.target.value)))}
            helperText={numArrTox16StrArr(byteArr).join(' ') || <>{' '}</>}
          />
          <Button
            variant='contained'
            onClick={() => handleSendTestRequest(USBFeatureRequests.USB_SPI_SEND_CMD, undefined, byteArr)}
            sx={{ height: 36.5, marginLeft: 1 }}
          >
            Send SPI Command
          </Button>
        </Box>
        <Box display='flex' flexDirection='column'>
          <FormLabel>Address</FormLabel>
          <Box display='flex'>
            <TextField
              value={addr}
              onChange={(event) => {
                dispatch(setSpiAddr(removeNonHexChars(event.target.value)))
              }}
              sx={{ width: 100 }}
            />
            <Box>
              <Button
                variant='contained'
                color='secondary'
                onClick={() => {
                  handleSendTestRequest(USBFeatureRequests.USB_SPI_SEND_CMD, undefined, readCmdToSend)
                }}
                sx={{ height: 36.5, marginLeft: 1 }}
              >
                Read Address
              </Button>
              <FormHelperText>
                Read Cmd: {numArrTox16StrArr(readCmdToSend).join(' ')}
              </FormHelperText>
            </Box>
            <Box>
              <Button
                variant='contained'
                color='secondary'
                onClick={() => {
                  handleSendTestRequest(USBFeatureRequests.USB_SPI_SEND_CMD, undefined, [SPICommand.WriteEnable, 0, 0, 0])
                  handleSendTestRequest(USBFeatureRequests.USB_SPI_SEND_CMD, undefined, smallSectorEraseCmdToSend)
                }}
                sx={{ height: 36.5, marginLeft: 1 }}
              >
                Small sector erase
              </Button>
              <FormHelperText>
                Cmd: {numArrTox16StrArr(smallSectorEraseCmdToSend).join(' ')}
              </FormHelperText>
            </Box>
          </Box>
          <Box display='flex'>
            <TextField
              value={data}
              onChange={(event) => {
                dispatch(setSpiData(removeNonHexChars(event.target.value)))
              }}
              sx={{ width: 100 }}
            />
            <Box>
              <Button
                variant='contained'
                color='secondary'
                onClick={() => {
                  handleSendTestRequest(USBFeatureRequests.USB_SPI_SEND_CMD, undefined, [SPICommand.WriteEnable, 0, 0, 0])
                  handleSendTestRequest(USBFeatureRequests.USB_SPI_SEND_CMD, undefined, writeCmdToSend)
                }}
                sx={{ height: 36.5, marginLeft: 1 }}
              >
                Write Data
              </Button>
              <FormHelperText>
                Write Cmd: {numArrTox16StrArr(writeCmdToSend).join(' ')}
              </FormHelperText>
            </Box>
          </Box>
        </Box>
      </Box>
      <Box display='flex' flexDirection='column'>
        <Button
          variant='outlined'
          onClick={() => handleSendTestRequest(USBFeatureRequests.USB_SPI_SEND_CMD, undefined, [SPICommand.StatusRegRead, 0, 0, 0])}
          sx={{ height: 36.5, marginBotton: 1 }}
        >
          Status Reg
        </Button>
        {statusRegBits.map((reg) => (
          <Box sx={{ display: 'flex' }}>
            <Port portName={reg} portState={statusReg[reg]} />
            {reg === 'WEN' && (
              <Button
                sx={{ padding: 0, fontSize: 10 }}
                variant='outlined'
                onClick={() => {
                  handleSendTestRequest(
                    USBFeatureRequests.USB_SPI_SEND_CMD,
                    undefined,
                    [statusReg.WEN ? SPICommand.WriteDisable : SPICommand.WriteEnable, 0, 0, 0]
                  )
                }}
              >
                {statusReg[reg] ? 'DIS' : 'EN'}
              </Button>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  )
}

export default SPIDebugTab

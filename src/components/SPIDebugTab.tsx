import { TextField } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { createSelector } from '@reduxjs/toolkit';
import { FC } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { removeNonHexChars, stringToByteArr } from '../helpers/stringToByteArr';
import { setSpiCmd } from '../redux/spiReducer';
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

const selector = createSelector([
  (state: RootState) => state.spiReducer.cmd,
  (state: RootState) => state.spiReducer.statusReg,
], (cmd, statusReg) => {
  const byteArr = stringToByteArr(cmd)
  const st = Math.min(byteArr.length, 8)
  const del = Math.max(0, byteArr.length - 8)
  const add = Math.max(0, 8 - byteArr.length)
  byteArr.splice(st, del, ...(new Array(add).fill(0)))
  return {
    cmd,
    // Should reverse each 32 bit word as most significant byte will be sent last
    byteArr: [...byteArr.slice(0, 4).reverse(), ...byteArr.slice(4).reverse()],
    statusReg,
  }
})

const SPIDebugTab: FC<Props> = ({ device }) => {
  const handleSendTestRequest = useUsbSendFeatureRequest(device)
  const dispatch = useDispatch()
  const { cmd, byteArr, statusReg } = useSelector(selector)

  return (
    <Box display='flex' flex={1}>
      <Box display='flex' flex={1}>
        <Box>
          <TextField
            label='SPI Command'
            value={cmd}
            onChange={(event) => dispatch(setSpiCmd(removeNonHexChars(event.target.value)))}
            sx={{ width: '100%' }}
            helperText={byteArr.map((val) => val.toString(16).toUpperCase()).join(' ')}
          />
        </Box>
        <Button
          variant='contained'
          onClick={() => handleSendTestRequest(USBFeatureRequests.USB_SPI_SEND_CMD, undefined, byteArr)}
          sx={{ height: 36.5, marginLeft: 1 }}
        >
          Send SPI Command
        </Button>
      </Box>
      <Box display='flex' flexDirection='column'>
        <Button
          variant='outlined'
          onClick={() => handleSendTestRequest(USBFeatureRequests.USB_SPI_SEND_CMD, undefined, [0, 0, 0, SPICommand.StatusRegRead])}
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
                    [0, 0, 0, statusReg.WEN ? SPICommand.WriteDisable : SPICommand.WriteEnable]
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

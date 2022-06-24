import { TextField, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { FC, ChangeEvent, useCallback, useState, useMemo } from 'react';
import { USBFeatureRequests, USBSubCommand } from '../usb/usbFeatureRequests';
import useUsbSendFeatureRequest from '../usb/useUsbSendFeatureRequest'

type Props = {
  device: HIDDevice
}

const validateBean = /[^0-9|a-f|A-F| ]/gi

const BeanDebugTab: FC<Props> = ({ device }) => {
  const handleSendTestRequest = useUsbSendFeatureRequest(device)
  const [bean, setBean] = useState<string>('')

  const handleChangeBean = useCallback(({ target: { value } }: ChangeEvent<{ value: string }>) => {
    setBean(value.replace(validateBean, ''))
  }, [])

  const beanCmd = useMemo(() => {
    const beanArr = bean.split(' ').reduce<number[]>((res, val) => {
      if (val.length <= 2) res.push(parseInt(val, 16))
      else {
        for (let i = 0; i < val.length; i += 2) {
          res.push(parseInt(val.slice(i, i + 2), 16))
        }
      }
      return res
    }, [])
    const length = beanArr.length - 1
    beanArr[0] = (beanArr[0] & 0xF0) + length
    return beanArr
  }, [bean])

  return (
    <Box display='flex' flex={1}>
      <Box width={300} display='flex' flexDirection='column'>
        <Button
          variant='contained'
          onClick={() => handleSendTestRequest(USBFeatureRequests.USB_ECHO)}
        >
          Sent Test Feature Request
        </Button>
        <Button
          variant='contained'
          onClick={() => handleSendTestRequest(USBFeatureRequests.USB_BEAN_DEBUG, USBSubCommand.BEAN_DEBUG_SET_1)}
          sx={{ marginTop: 1 }}
        >
          Bean Debug: Set to 1
        </Button>
        <Button
          variant='contained'
          onClick={() => handleSendTestRequest(USBFeatureRequests.USB_BEAN_DEBUG, USBSubCommand.BEAN_DEBUG_SET_0)}
          sx={{ marginTop: 1 }}
        >
          Bean Debug: Set to 0
        </Button>
      </Box>
      <Box display='flex' ml={2} flex={1}>
        <Box>
          <Typography>
            Format: |PRI-ML(ML=auto calc)|DST-ID|MSG-ID|Data(1~11)|
          </Typography>
          <TextField
            value={bean}
            onChange={handleChangeBean}
            helperText={beanCmd.map((val) => val.toString(16).toUpperCase()).join(' ')}
            sx={{ width: '100%' }}
          />
        </Box>
        <Button
          variant='contained'
          onClick={() => handleSendTestRequest(USBFeatureRequests.USB_SEND_BEAN, undefined, beanCmd)}
          sx={{ height: 36.5, marginLeft: 1 }}
        >
          Send BEAN Command
        </Button>
      </Box>
    </Box>
  )
}

export default BeanDebugTab
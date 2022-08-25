import { Checkbox, FormControlLabel, TextField, Tooltip, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { FC, useState, useMemo } from 'react';
import { removeNonHexChars, stringToByteArr } from '../helpers/stringToByteArr';
import { USBFeatureRequests, USBSubCommand } from '../usb/usbFeatureRequests';
import useUsbSendFeatureRequest from '../usb/useUsbSendFeatureRequest'

type Props = {
  device: HIDDevice | undefined
}

const Crc8 = (pcBlock: number[]) => {
  let crc = 0x00;
  for (let l = 0; l < pcBlock.length; l++) {
    crc ^= pcBlock[l];

    for (let i = 0; i < 8; i++) {
      crc = (crc & 0x80) ? (crc << 1) ^ 0x13 : crc << 1;
      crc &= 0xFF;
    }
  }

  return crc;
}

const BeanDebugTab: FC<Props> = ({ device }) => {
  const handleSendTestRequest = useUsbSendFeatureRequest(device)
  const [bean, setBean] = useState<string>('')
  const [recTicks, setRecTicks] = useState<boolean>(false)

  const beanCmd = useMemo(() => {
    const beanArr = stringToByteArr(bean)
    const length = beanArr.length - 1
    beanArr[0] = (beanArr[0] & 0xF0) + length
    beanArr.push(Crc8(beanArr))
    return beanArr
  }, [bean])

  return (
    <Box display='flex' flex={1}>
      <Box width={240} display='flex' flexDirection='column'>
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
      <Box display='flex' ml={2} flex={1} flexDirection='column'>
        <Typography>
          Format: |PRI-ML(ML=auto calc)|DST-ID|MSG-ID|Data(1~11)|
        </Typography>
        <TextField
          value={bean}
          onChange={(event) => setBean(removeNonHexChars(event.target.value))}
          helperText={beanCmd.map((val) => val.toString(16).toUpperCase()).join(' ')}
          sx={{ width: '100%' }}
        />
      </Box>
      <Box display='flex' ml={2} width={200} flexDirection='column'>
        <Button
          variant='contained'
          /* ToDo: consider removing t3cnt */
          onClick={() => handleSendTestRequest(
            recTicks ? USBFeatureRequests.USB_LISTERN_BEAN_REC_TICKS : USBFeatureRequests.USB_LISTERN_BEAN,
            undefined)
          }
          sx={{ height: 36.5 }}
        >
          Listern BEAN
        </Button>
        <Button
          variant='contained'
          onClick={() => handleSendTestRequest(
            recTicks ? USBFeatureRequests.USB_SEND_BEAN_CMD_REC_TICKS : USBFeatureRequests.USB_SEND_BEAN_CMD,
            undefined,
            beanCmd)
          }
          sx={{ height: 36.5, marginTop: 1 }}
        >
          Send BEAN Command
        </Button>
        <FormControlLabel
          label={
            <>Receive ticks count{' '}
              <Tooltip
                title={
                  <>
                    Format:{' '}<br />
                    <b style={{ color: 'red' }}>x</b>-yy - prevous impulse on BEAN was low (zero)<br />
                    <b style={{ color: 'green' }}>x</b>-yy - prevous impulse on BEAN was high (one)<br />
                    x - cnt number (number of bits. Can be 1 to 6)<br />
                        cnt = TMR / T_CNT + (reminder {'>'} (3/4 * T_CNT ? 1 : 0)<br/>
                    y - reminder.
                        reminder = TMR - ((TMR / T_CNT) * T_CNT))<br />

                  </>
                }
              >
                <b style={{ fontSize: 20, color: 'red' }}>!</b>
              </Tooltip>
            </>
          }
          control={
            <Checkbox
              checked={recTicks}
              onChange={() => setRecTicks(!recTicks)}
            />
          }
        />
      </Box>
    </Box>
  )
}

export default BeanDebugTab
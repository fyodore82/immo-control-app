import { FormLabel, RadioGroup, Radio, FormControl, FormControlLabel, TextField, Tooltip, Typography, List, ListItem } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { FC, useRef, useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import beanCmdAsArrSelector from '../selectors/beanCmdAsArrSelector';
import { BeanState, clearCommands, sendBeanCmd, setBean, setCmdType, setMinDelayMs, setRepeatCnt } from '../redux/beanReducer';
import { RootState } from '../redux/store';
import { USBFeatureRequests } from '../usb/usbFeatureRequests';
import useUsbSendFeatureRequest from '../usb/useUsbSendFeatureRequest';
import SPILogEntry from './SPILogEntry';
import BeanCmdLogEntry from './BeanCmdLogEntry';

type Props = {
  device: HIDDevice | undefined
}

const cmdTypeToBtnNameMap: { [cmdType in BeanState['cmdType']]: string } = {
  singleCmd: 'Send single BEAN command',
  multiCmd: 'Send multiple BEAN commands',
  tickCount: 'Show tick count',
}

const BeanDebugTab: FC<Props> = ({ device }) => {
  const handleSendTestRequest = useUsbSendFeatureRequest(device)
  const dispatch: any = useDispatch()
  const {
    beanCmd,
    cmdType,
    minDelayMs,
    repeatCnt,
    commands,
  } = useSelector((state: RootState) => state.beanReducer)

  const beanCmdAsArr = useSelector(beanCmdAsArrSelector)

  const promise = useRef<any>()
  const [isBeanCmdSending, setIsBeanCmdSending] = useState<boolean>(false)
  const handleSendCmd = useCallback(async () => {
    if (!device) return
    promise.current = dispatch(sendBeanCmd({ device }))
    if (cmdType === 'multiCmd') {
      setIsBeanCmdSending(true)
      await promise.current
      setIsBeanCmdSending(false)
    }
  }, [cmdType, device, dispatch])

  return (
    <Box display='flex' flex={1}>
      <Box display='flex' mr={2} flex={1} flexDirection='column'>
        <Typography>
          Format: |PRI-ML(ML=auto calc)|DST-ID|MSG-ID|Data(1~11)|
        </Typography>
        <TextField
          value={beanCmd}
          onChange={(event) => dispatch(setBean((event.target.value)))}
          helperText={beanCmdAsArr.map((val) => val.toString(16).toUpperCase()).join(' ')}
          sx={{ width: '100%' }}
        />
        <Box display='flex'>
          <Box display='flex' ml={2} width={500} flexDirection='column'>
            <FormControl>
              <FormLabel>Send type</FormLabel>
              <RadioGroup value={cmdType} onChange={(event) => dispatch(setCmdType(event.target.value as any))}>
                <FormControlLabel
                  value="singleCmd"
                  control={<Radio />}
                  label={
                    <Box display='flex' justifyContent='space-between'>
                      Single
                      <Button
                        variant='contained'
                        onClick={() => handleSendTestRequest(
                          cmdType === 'singleCmd' ? USBFeatureRequests.USB_LISTERN_BEAN : USBFeatureRequests.USB_LISTERN_BEAN_REC_TICKS,
                          undefined)
                        }
                        sx={{ height: 36.5, marginLeft: '200px' }}
                        disabled={cmdType !== 'tickCount' && cmdType !== 'singleCmd'}
                      >
                        {cmdType === 'tickCount' ? 'Listern Ticks' : 'Listern BEAN'}
                      </Button>
                  </Box>
                }
                />
                <FormControlLabel
                  value="tickCount"
                  control={<Radio />}
                  label={
                    <>Tick Count{' '}
                      <Tooltip
                        title={
                          <>
                            Format:{' '}<br />
                            <b style={{ color: 'red' }}>x</b>-yy - prevous impulse on BEAN was low (zero)<br />
                            <b style={{ color: 'green' }}>x</b>-yy - prevous impulse on BEAN was high (one)<br />
                            x - cnt number (number of bits. Can be 1 to 6)<br />
                            cnt = TMR / T_CNT + (reminder {'>'} (3/4 * T_CNT ? 1 : 0)<br />
                            y - reminder.
                            reminder = TMR - ((TMR / T_CNT) * T_CNT))<br />
                          </>
                        }
                      >
                        <b style={{ fontSize: 20, color: 'red' }}>!</b>
                      </Tooltip>
                    </>
                  }
                />
                <FormControlLabel
                  value="multiCmd"
                  control={<Radio />}
                  label={
                    <Box display='flex' alignItems='center'>
                      <Box sx={{ flexBasis: '50%' }}>Repeat BEAN Cmd</Box>
                      <TextField
                        disabled={cmdType !== 'multiCmd'}
                        value={minDelayMs}
                        onChange={(event) => dispatch(setMinDelayMs(+event.target.value))}
                        sx={{ flexBasis: '30%', marginRight: 1 }}
                        label='Min Delay (ms)'
                      />
                      <TextField
                        disabled={cmdType !== 'multiCmd'}
                        value={repeatCnt}
                        onChange={(event) => dispatch(setRepeatCnt(+event.target.value))}
                        sx={{ flexBasis: '20%' }}
                        label='Repeat Count'
                      />
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>
            <Box display='flex' width='100%' justifyContent='space-between'>
            <Button
              variant='contained'
              onClick={(isBeanCmdSending) ? (() => promise.current.abort()) : handleSendCmd}
              sx={{ height: 36.5, marginTop: 1 }}
            >
              {isBeanCmdSending ? 'Cancel command' : cmdTypeToBtnNameMap[cmdType]}
            </Button>

            <Button
              variant='contained'
              color='secondary'
              onClick={() => dispatch(clearCommands())}
              sx={{ height: 36.5, marginTop: 1 }}
            >
              Clear BEAN Log
            </Button>
            </Box>
          </Box>
        </Box>
      </Box>
      <List
        sx={{ border: `1px solid black`, flex: "1 1 50%", overflow: "auto" }}
      >
        {Object.values(commands).length === 0 && <ListItem>Log is empty</ListItem>}
        {Object.entries(commands).map(([cmd, { cmdArr, count }]) => (
          <ListItem key={cmd} sx={{ padding: `0 16px` }}>
            <BeanCmdLogEntry cmdArr={cmdArr} count={count} />
          </ListItem>
        ))}
      </List>
    </Box>
  )
}

export default BeanDebugTab
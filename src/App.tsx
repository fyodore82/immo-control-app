import { Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { FC, useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import Logger from './Logger';
import { log } from './redux/logsReducer';

const vendorId = 0x04D8
const productId = 0x0032

const App: FC = () => {
  const [device, setDevice] = useState<HIDDevice | undefined>(undefined)
  const dispatch = useDispatch()

  const handleSendTestRequest = useCallback(async () => {
    try {
      if (device && device.opened) {
        await device.sendReport(0, Uint8Array.from([0x90]))
      }
    } catch (error: any) {
      dispatch(log({ message: error.message, isError: true }));
    }
  }, [device, dispatch])

  const handleStartBootloader = useCallback(async () => {
    try {
      if (device && device.opened) {
        await device.sendReport(0, Uint8Array.from([0x80]))
      }
    } catch (error: any) {
      dispatch(log({ message: error.message, isError: true }));
    }
  }, [device, dispatch])

  const handleConnect = useCallback(async () => {
    try {
      const devices = await navigator.hid.requestDevice({
        filters: [{ vendorId, productId },
        ],
      });
      const device = devices[0]
      if (device && !device.opened) {
        await device.open()
        setDevice(device)
      }
    } catch (error: any) {
      dispatch(log({ message: error.message, isError: true }));
    }
  }, [dispatch])

  useEffect(() => {
    if (!device) return
    const onInputReport = (event: HIDInputReportEvent) => {
      dispatch(log({
        message: `ReportId: ${event.reportId}, length: ${event.data.byteLength}, data0: ${event.data.getUint8(0)}`,
      }))
    }
    device.addEventListener('inputreport', onInputReport)
    return () => {
      device.removeEventListener('inputreport', onInputReport)
    }

  }, [device, dispatch])

  useEffect(() => {
    const onconnect = ({device}: HIDConnectionEvent) => {
      dispatch(log({ message: `HID connected: ${device.productName}` }));
    };
    navigator.hid.addEventListener('connect', onconnect)
    const ondisconnect = ({device}: HIDConnectionEvent) => {
      dispatch(log({ message: `HID DISconnected: ${device.productName}` }));
    };
    navigator.hid.addEventListener('disconnect', ondisconnect)
    return () => {
      navigator.hid.removeEventListener('connect', onconnect)
      navigator.hid.removeEventListener('disconnect', ondisconnect)
    }
  }, [dispatch])

  const handleDisconnect = useCallback(async () => {
    if (device) {
      if (device.opened) await device.close()
      setDevice(undefined)
    }
  }, [device])

  const disabled = !device || !device.opened

  return (
    <Box m={3} display='flex' flexDirection='column'>
      <Box display='flex' alignItems='center' mb={1}>
        <Typography>
          Device status (VID: <b>{vendorId.toString(16)}</b>, PID: <b>{productId.toString(16)}</b>):
          {disabled ? 'disconnected' : 'connected'}
        </Typography>
        <Button
          sx={{ marginLeft: 2 }}
          variant='contained'
          onClick={handleConnect}
        >
          Connect
        </Button>
        <Button
          sx={{ marginLeft: 2 }}
          variant='contained'
          onClick={handleDisconnect}
        >
          Disconnect
        </Button>

      </Box>
      <Button
        variant='contained'
        onClick={handleSendTestRequest}
        disabled={disabled}
      >
        Sent Test Feature Request
      </Button>

      <Button
        sx={{ marginTop: 1 }}
        variant='contained'
        color='secondary'
        onClick={handleStartBootloader}
        disabled={disabled}
      >
        Start Bootloader
      </Button>

      <Logger sx={{ marginTop: 16, border: `1px solid black` }}/>
    </Box>
  );
}

export default App;
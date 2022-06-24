import { Tab, Tabs, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { FC, useState } from 'react';
import BeanDebugTab from './components/BeanDebugTab';
import Logger from './components/Logger';
import useUsbDevice from './usb/useUsbDevice';
import useUsbSendFeatureRequest from './usb/useUsbSendFeatureRequest'
import { USBFeatureRequests } from './usb/usbFeatureRequests';

const vendorId = 0x04D8
const productId = 0x0032

const App: FC = () => {
  const {
    handleConnect,
    handleDisconnect,
    device,
  } = useUsbDevice()

  const sendUsbFeatureReq = useUsbSendFeatureRequest(device)

  const deviceDisconnected = !device || !device.opened

  const [tab, setTab] = useState<string | undefined>('BeanDebugTab')

  return (
    <Box p={3} display='flex' flexDirection='column' height='100%' boxSizing='border-box'>
      <Box display='flex' alignItems='center' mb={1}>
        <Typography>
          Device status (VID: {vendorId.toString(16)}, PID: {productId.toString(16)}):{' '}
          <b>{deviceDisconnected ? 'disconnected' : 'connected'}</b>
        </Typography>
      </Box>
      <Box display='flex' alignItems='center' mb={1}>
        <Button
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
        <Button
          sx={{ marginLeft: 'auto' }}
          variant='contained'
          color='secondary'
          onClick={() => sendUsbFeatureReq(USBFeatureRequests.USB_NO_CMD)}
          disabled={deviceDisconnected}
        >
          Send USB_NO_CMD
        </Button>
        <Button
          sx={{ marginLeft: 1 }}
          variant='contained'
          color='secondary'
          onClick={() => sendUsbFeatureReq(USBFeatureRequests.USB_START_BOOTLOADER)}
          disabled={deviceDisconnected}
        >
          Start Bootloader
        </Button>
      </Box>

      <Tabs value={tab} onChange={(_, tab) => setTab(tab)}>
        <Tab label='Debugger' value='debugger' disabled={deviceDisconnected} />
      </Tabs>
      <Box p={3} display='flex' flex='1 1 50%' flexDirection='column' boxSizing='border-box'>
        {deviceDisconnected ? (
          <Typography
            sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}
          >
            Connect device first
          </Typography>
        ) : (
          <>
            {tab === 'BeanDebugTab' && <BeanDebugTab device={device} />}
          </>
        )}
      </Box>
      <Logger sendUsbFeatureReq={sendUsbFeatureReq} deviceDisconnected={deviceDisconnected} />
    </Box>
  );
}

export default App;
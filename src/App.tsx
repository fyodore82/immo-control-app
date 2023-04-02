import { Tab, Tabs, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { FC, useEffect, useState } from 'react';
import BeanDebugTab from './components/BeanDebugTab';
import Logger from './components/Logger';
import useUsbDevice from './usb/useUsbDevice';
import useUsbSendFeatureRequest from './usb/useUsbSendFeatureRequest'
import { USBFeatureRequests } from './usb/usbFeatureRequests';
import SPIDebugTab from './components/SPIDebugTab'
import { createStructuredSelector } from "reselect"
import { RootState } from "./redux/store"
import { useSelector } from 'react-redux';
import { setEchoReceived } from './redux/logsReducer';
import PortsTab from './components/PortsTab';
import SoundsTab from './components/SoundsTab';
import ReadSPILogTab from './components/ReadSpiLogTab';

const vendorId = 0x04D8
const productId = 0x0032

const selector = createStructuredSelector({
  echoReceived: (state: RootState) => state.logsReducer.echoReceived,
})

const App: FC = () => {
  const {
    handleConnect,
    handleDisconnect,
    device,
  } = useUsbDevice()

  const { echoReceived } = useSelector(selector)

  const sendUsbFeatureReq = useUsbSendFeatureRequest(device)

  const deviceDisconnected = !device || !device.opened

  const [tab, setTab] = useState<string | undefined>('BeanDebugTab')

  return (
    <Box p={3} display='flex' flexDirection='column' height='100%' boxSizing='border-box'>
      <Box display='flex' alignItems='center' mb={1}>
        <Typography>
          Device status (VID: {vendorId.toString(16)}, PID: {productId.toString(16)}):{' '}
          <b style={{ color: deviceDisconnected ? 'red' : 'green' }}>
            {deviceDisconnected ? 'disconnected' : 'connected'}
          </b>
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
          variant='outlined'
          color='secondary'
          onClick={() => sendUsbFeatureReq(USBFeatureRequests.USB_DISABLE_PERIODIC_IMMO_BEAN_CMD)}
          disabled={deviceDisconnected}
        >
          Dis IMMO Bean cmd
        </Button>
        <Button
          sx={{ marginLeft: 1 }}
          variant='outlined'
          color='primary'
          onClick={() => sendUsbFeatureReq(USBFeatureRequests.USB_ENABLE_PERIODIC_IMMO_BEAN_CMD)}
          disabled={deviceDisconnected}
        >
          En IMMO Bean cmd
        </Button>
        <Button
          sx={{ marginLeft: 1 }}
          variant='contained'
          color='secondary'
          onClick={() => sendUsbFeatureReq(USBFeatureRequests.USB_NO_CMD)}
          disabled={deviceDisconnected}
        >
          Send USB_NO_CMD
        </Button>
        <Button
          variant='contained'
          onClick={() => sendUsbFeatureReq(USBFeatureRequests.USB_ECHO)}
          sx={{ marginLeft: 1, outline: echoReceived ? '3px solid green' : undefined }}
        >
          Sent Test Feature Request
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
        <Tab label='BEAN debug' value='BeanDebugTab' />
        <Tab label='SPI debug' value='SpiDebugTab' />
        <Tab label='Read SPI log' value='ReadSpiLogTab' />
        <Tab label='Ports' value='PortsDebugTab' />
        <Tab label='Sounds' value='SoundsTab' />
      </Tabs>
      <Box pt={1} pb={1} display='flex' flex='1 1 50%' flexDirection='column' boxSizing='border-box' minHeight={0}>
        {/* {deviceDisconnected ? (
          <Typography
            sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}
          >
            Connect device first
          </Typography>
        ) : ( */}
        {tab === 'BeanDebugTab' && <BeanDebugTab device={device} />}
        {tab === 'SpiDebugTab' && <SPIDebugTab device={device} />}
        {tab === 'ReadSpiLogTab' && <ReadSPILogTab device={device} />}
        {tab === 'PortsDebugTab' && <PortsTab device={device} />}
        {tab === 'SoundsTab' && <SoundsTab device={device} />}
      </Box>
      <Logger sendUsbFeatureReq={sendUsbFeatureReq} deviceDisconnected={deviceDisconnected} />
    </Box>
  );
}

export default App;
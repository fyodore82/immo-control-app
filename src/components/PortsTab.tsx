import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import { FC, useCallback, useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"
import { createStructuredSelector } from "reselect"
import { LogsState, toggleRotatePortsView } from "../redux/logsReducer"
import { RootState } from "../redux/store"
import Port from "./Port"
import useUsbSendFeatureRequest from "../usb/useUsbSendFeatureRequest"
import { USBFeatureRequests } from "../usb/usbFeatureRequests"
import TogglePort from "./TogglePort"

const selector = createStructuredSelector({
  ports: (state: RootState) => state.logsReducer.ports,
  rotatePortsView: (state: RootState) => state.logsReducer.rotatePortsView,
})

const leftPorts: {
  pin: keyof LogsState['ports']
  name?: string
  in?: true
  out?: true
  mask?: number[]
}[] = [
  { pin: 'MCLR' },
  { pin: 'ra0' },
  { pin: 'ra1' },
  { pin: 'rb0', name: 'Button', in: true },
  { pin: 'rb1', name: 'SI1' },
  { pin: 'rb2', name: 'SO1' },
  { pin: 'rb3', name: '_CS'},
  { pin: 'VSS' },
  { pin: 'ra2', name: 'CLK' },
  { pin: 'ra3', name: 'CLK' },
  { pin: 'rb4', name: 'Capot', in: true },
  { pin: 'ra4', name: 'ImmoOn', out: true, mask: [0, 0, 0, 0, 0b10000, 0, 0, 0, 0] },
  { pin: 'VDD' },
  { pin: 'rb5', name: 'ImmoSence', in: true },
]
const rightPorts: {
  pin: keyof LogsState['ports']
  name?: string
  in?: true
  out?: true
  mask?: number[]
}[] = [
  { pin: 'Vbus' },
  { pin: 'rb7', name: 'ASR+12', in: true },
  { pin: 'rb8', name: 'BEAN IN', in: true },
  { pin: 'rb9', name: 'GND' },
  { pin: 'VSS' },
  { pin: 'Vcap' },
  { pin: 'rb10', name: 'USB D+' },
  { pin: 'rb11', name: "USB D-" },
  { pin: 'Vusb' },
  { pin: 'rb13', name: 'BEAN OUT', out: true, mask: [0, 0, 0, 0, 0, 0, 0b100000, 0, 0] },
  { pin: 'rb14', name: 'SCK1' },
  { pin: 'rb15', name: 'Beeper Ctrl', out: true, mask: [0, 0, 0, 0, 0b10000000, 0, 0, 0, 0] },
  { pin: 'AVss' },
  { pin: 'AVdd' },
]

type Props = {
  device: HIDDevice | undefined
}

const PortsTab: FC<Props> = ({ device }) => {
  const {
    ports,
    rotatePortsView,
  } = useSelector(selector)

  const dispatch = useDispatch()

  const {
    leftPortsLocal,
    rightPortsLocal
  } = useMemo(() => ({
    leftPortsLocal: rotatePortsView ? rightPorts : leftPorts,
    rightPortsLocal: rotatePortsView ? [...leftPorts].reverse() : [...rightPorts].reverse(),
  }), [rotatePortsView])

  const sendUsbFeatureReq = useUsbSendFeatureRequest(device)

  /*
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

  */

  const handleSetPort = useCallback((state: boolean | undefined, mask?: number[]) => {
    if (!mask) return
    if (state === false) sendUsbFeatureReq(USBFeatureRequests.USB_SET_PORT_STATE0, undefined, mask)
    if (state === true) sendUsbFeatureReq(USBFeatureRequests.USB_SET_PORT_STATE1, undefined, mask)
  }, [sendUsbFeatureReq])

  return (
    <Box display='flex' ml={1} minWidth={0} justifyContent='center'>
      <Box display='flex' flexDirection='column' ml={1}>
        <Button
          variant='outlined'
          color='primary'
          onClick={() => sendUsbFeatureReq(USBFeatureRequests.USB_GET_PORTS_STATE)}
        >
          Req ports
        </Button>
        <Box display='flex' flexDirection='row' mb={1} mt={1}>
          <Box>
            {leftPortsLocal.map(({ out, in: In, mask }) => <TogglePort out={out} In={In} onSetPort={(state) => handleSetPort(state, mask)} />)}
          </Box>
          <Box>
            {leftPortsLocal.map(({ name, pin }) => <Port portName={name || ' '} portState={ports[pin]} />)}
          </Box>
          <Box>
            {leftPortsLocal.map(({ pin }) => <Port portName={pin} portState={ports[pin]} />)}
          </Box>
          <Box>
            {rightPortsLocal.map(({ pin }) => <Port portName={pin} portState={ports[pin]} />)}
          </Box>
          <Box>
            {rightPortsLocal.map(({ name, pin }) => <Port portName={name || ' '} portState={ports[pin]} />)}
          </Box>
          <Box>
            {rightPortsLocal.map(({ out, in: In, mask }) => <TogglePort out={out} In={In} onSetPort={(state) => handleSetPort(state, mask)} />)}
          </Box>
        </Box>
        <Button
          variant='outlined'
          color='secondary'
          onClick={() => dispatch(toggleRotatePortsView())}
        >
          Rotate
        </Button>
      </Box>
    </Box>
  )
}

export default PortsTab

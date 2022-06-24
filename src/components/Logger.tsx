import Box from "@mui/material/Box"
import Checkbox from "@mui/material/Checkbox"
import FormControlLabel from "@mui/material/FormControlLabel"
import List from "@mui/material/List"
import ListItem from "@mui/material/ListItem"
import Button from "@mui/material/Button"
import { FC, useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"
import { createStructuredSelector } from "reselect"
import { clearLog, toggleLogKnownEvents, toggleRotatePortsView } from "../redux/logsReducer"
import { RootState } from "../redux/store"
import Port from "./Port"
import useUsbSendFeatureRequest from "../usb/useUsbSendFeatureRequest"
import { USBFeatureRequests } from "../usb/usbFeatureRequests"

const selector = createStructuredSelector({
  logs: (state: RootState) => state.logsReducer.logs,
  logKnownEvents: (state: RootState) => state.logsReducer.logKnownEvents,
  ports: (state: RootState) => state.logsReducer.ports,
  rotatePortsView: (state: RootState) => state.logsReducer.rotatePortsView,
})

const leftPorts = [
  'MCLR',
  'ra0',
  'ra1',
  'rb0',
  'rb1',
  'rb2',
  'rb3',
  'VSS',
  'ra2',
  'ra3',
  'rb4',
  'ra4',
  'VDD',
  'rb5',
]
const rightPorts = [
  'Vbus',
  'rb7',
  'rb8',
  'rb9',
  'Vss',
  'Vcap',
  'rb10',
  'rb11',
  'Vusb',
  'rb13',
  'rb14',
  'rb15',
  'AVss',
  'AVdd',
]

type Props = {
  sendUsbFeatureReq: ReturnType<typeof useUsbSendFeatureRequest>,
  deviceDisconnected: boolean
}

const Logger: FC<Props> = ({
  sendUsbFeatureReq,
  deviceDisconnected,
}) => {
  const {
    logs,
    logKnownEvents,
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

  return (
    <Box display='flex'>
      <Box display='flex' flexDirection='column' flex='1'>
        <Box display='flex' mb={1}>
          <FormControlLabel
            label="Log known USB events"
            control={
              <Checkbox
                checked={logKnownEvents}
                onChange={() => dispatch(toggleLogKnownEvents())}
              />
            }
          />
          <Button
            sx={{ marginLeft: 'auto' }}
            variant='contained'
            onClick={() => dispatch(clearLog())}
          >
            Clear Log
          </Button>
        </Box>
        <List
          sx={{ border: `1px solid black`, flex: '1 1 50%', overflow: 'auto' }}
        >
          {logs.length === 0 && <ListItem>Log is empty</ListItem>}
          {logs.map(log => (
            <ListItem
              key={log.dateTime}
              sx={{ padding: `0 16px` }}
            >
              {new Date(log.dateTime).toLocaleTimeString()}: {log.message}
            </ListItem>
          ))}
        </List>
      </Box>
      <Box display='flex' flexDirection='column' ml={1}>
        <Button
          variant='outlined'
          color='primary'
          disabled={deviceDisconnected}
          onClick={() => sendUsbFeatureReq(USBFeatureRequests.USB_GET_PORTS_STATE)}
        >
          Req ports
        </Button>
        <Box display='flex' flexDirection='row' mb={1} mt={1}>
          <Box>
            {leftPortsLocal.map(portName => <Port portName={portName} ports={ports} />)}
          </Box>
          <Box>
            {rightPortsLocal.map(portName => <Port portName={portName} ports={ports} />)}
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

export default Logger

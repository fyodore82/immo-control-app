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
import { Typography } from "@mui/material"

const selector = createStructuredSelector({
  ports: (state: RootState) => state.logsReducer.ports,
  rotatePortsView: (state: RootState) => state.logsReducer.rotatePortsView,
  globalState: (state: RootState) => state.logsReducer.globalState,
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
    { pin: 'rb3', name: '_CS' },
    { pin: 'VSS' },
    { pin: 'ra2', name: 'CLK' },
    { pin: 'ra3', name: 'CLK' },
    { pin: 'rb4', name: 'Capot', in: true },
    { pin: 'ra4', name: 'ImmoOn', out: true, mask: [0, 0, 0, 0b10000, 0, 0, 0, 0] },
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
    { pin: 'rb9', name: 'RB9', out: true, mask: [0, 0, 0, 0, 0, 0, 0b10, 0, 0] },
    { pin: 'VSS' },
    { pin: 'Vcap' },
    { pin: 'rb10', name: 'USB D+' },
    { pin: 'rb11', name: "USB D-" },
    { pin: 'Vusb' },
    { pin: 'rb13', name: 'BEAN OUT', out: true, mask: [0, 0, 0, 0, 0, 0, 0b100000, 0, 0] },
    { pin: 'rb14', name: 'SCK1' },
    { pin: 'rb15', name: 'Beeper Ctrl', out: true, mask: [0, 0, 0, 0, 0, 0, 0b10000000, 0, 0] },
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
    globalState,
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

  const handleSetPort = useCallback((state: boolean | undefined, mask?: number[]) => {
    if (!mask) return
    if (state === false) sendUsbFeatureReq(USBFeatureRequests.USB_SET_PORT_STATE0, undefined, mask)
    if (state === true) sendUsbFeatureReq(USBFeatureRequests.USB_SET_PORT_STATE1, undefined, mask)
  }, [sendUsbFeatureReq])

  return (
    <Box display='flex' ml={1} minWidth={0} justifyContent='space-evenly'>
      <Box display='flex' flexDirection='column' ml={1}>
        <Box display='flex'>
          <Button
            variant='outlined'
            color='primary'
            onClick={() => sendUsbFeatureReq(USBFeatureRequests.USB_GET_PORTS_STATE)}
          >
            Req ports
          </Button>
        </Box>
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
      <Box>
        <Box display='flex'>
          <Button
            variant='outlined'
            color='primary'
            onClick={() => sendUsbFeatureReq(USBFeatureRequests.USB_GET_GLOBAL_STATE)}
          >
            Req Global State
          </Button>
          <Button
            variant='outlined'
            color='primary'
            sx={{ marginLeft: 1 }}
            onClick={() => sendUsbFeatureReq(USBFeatureRequests.USB_MONITOR_GLOBAL_STATE)}
          >
            Monitor Global State
          </Button>
        </Box>
        <Box display='flex' flexDirection='column'>
          <Box display='flex' flexDirection='row'>
            <Typography>spiAddr: </Typography>
            <Typography sx={{ fontWeight: 'bold' }}>{globalState.spiAddr != null ? `0x${globalState.spiAddr?.toString(16)}` : ''}</Typography>
          </Box>
          <Box display='flex' flexDirection='row'>
            <Typography>spiTask: </Typography>
            <Typography sx={{ fontWeight: 'bold' }}>{globalState.spiTask != null ? `0x${globalState.spiTask?.toString(16)}` : ''}</Typography>
          </Box>
          <Box display='flex' flexDirection='row'>
            <Typography>initialTasks: </Typography>
            <Typography sx={{ fontWeight: 'bold' }}>{globalState.initialTasks != null ? `0x${globalState.initialTasks?.toString(16)}` : ''}</Typography>
          </Box>

          <Box display='flex' flexDirection='row' justifyContent='space-between'>
            <Typography sx={{ whiteSpace: 'pre' }}>
              buttonTest:
              <Typography component='span' sx={{ fontWeight: 'bold' }}>{globalState.buttonTest != null ? `0x${globalState.buttonTest?.toString(16)}` : ''}</Typography>
            </Typography>
            <Port portName='Button' portState={globalState.buttonIn} />
          </Box>
          <Box display='flex' flexDirection='row' justifyContent='space-between'>
            <Typography sx={{ whiteSpace: 'pre' }}>
              capotTest:
              <Typography component='span' sx={{ fontWeight: 'bold' }}>{globalState.capotTest != null ? `0x${globalState.capotTest?.toString(16)}` : ''}</Typography>
            </Typography>
            <Port portName='Capot' portState={globalState.capotIn} />
          </Box>
          <Box display='flex' flexDirection='row' justifyContent='space-between'>
            <Typography sx={{ whiteSpace: 'pre' }}>
              immoSenceTest:
              <Typography component='span' sx={{ fontWeight: 'bold' }}>{globalState.immoSenceTest != null ? `0x${globalState.immoSenceTest?.toString(16)}` : ''}</Typography>
            </Typography>
            <Port portName='Immo Sence' portState={globalState.immoSenceIn} />
          </Box>
          <Box display='flex' flexDirection='row' justifyContent='space-between'>
            <Typography sx={{ whiteSpace: 'pre' }}>
              asr12VTest:
              <Typography component='span' sx={{ fontWeight: 'bold' }}>{globalState.asr12VTest != null ? `0x${globalState.asr12VTest?.toString(16)}` : ''}</Typography>
            </Typography>
            <Port portName='ASR 12V' portState={globalState.asr12VIn} />
          </Box>
        </Box>
      </Box>
    </Box >
  )
}

export default PortsTab

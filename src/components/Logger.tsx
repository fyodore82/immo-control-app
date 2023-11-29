import Box from "@mui/material/Box"
import Checkbox from "@mui/material/Checkbox"
import FormControlLabel from "@mui/material/FormControlLabel"
import List from "@mui/material/List"
import ListItem from "@mui/material/ListItem"
import Button from "@mui/material/Button"
import { FC } from "react"
import { useDispatch, useSelector } from "react-redux"
import { createStructuredSelector } from "reselect"
import { clearLog, toggleLogKnownEvents } from "../redux/logsReducer"
import { RootState } from "../redux/store"
import useUsbSendFeatureRequest from "../usb/useUsbSendFeatureRequest"

const selector = createStructuredSelector({
  logs: (state: RootState) => state.logsReducer.logs,
  logKnownEvents: (state: RootState) => state.logsReducer.logKnownEvents,
})

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
  } = useSelector(selector)

  const dispatch = useDispatch()

  return (
    <Box display='flex' flex='1 1 50%' sx={{ minHeight: 0 }}>
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
              key={log.logKey}
              sx={{ padding: `0 16px` }}
            >
              {new Date(log.dateTime).toLocaleTimeString()}: {log.message}
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  )
}

export default Logger

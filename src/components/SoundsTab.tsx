import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import { FC } from "react"
import useUsbSendFeatureRequest from "../usb/useUsbSendFeatureRequest"
import { USBFeatureRequests } from "../usb/usbFeatureRequests"

type Props = {
  device: HIDDevice | undefined
}

const SoundsTab: FC<Props> = ({ device }) => {
  const sendUsbFeatureReq = useUsbSendFeatureRequest(device)

  return (
    <Box display='flex' ml={1} minWidth={0} justifyContent='center'>
      <Box display='flex' flexDirection='column' ml={1}>
        <Button
          variant='outlined'
          color='primary'
          onClick={() => sendUsbFeatureReq(USBFeatureRequests.USB_PLAY_BEEP_SOUND)}
        >
          Do Re Mi Fa
        </Button>
      </Box>
    </Box>
  )
}

export default SoundsTab

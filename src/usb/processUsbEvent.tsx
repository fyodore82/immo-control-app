import { SPICommand, USBFeatureResponses } from "./usbFeatureRequests";
import { setStatusReg } from "../redux/spiReducer";
import { log, setEchoReceived, setPins } from "../redux/logsReducer";

const knownSpiCommands: { [key in SPICommand]?: boolean } = {
  [SPICommand.StatusRegRead]: true,
  [SPICommand.WriteDisable]: true,
  [SPICommand.WriteEnable]: true,
}

const knownEvents = {
  [USBFeatureResponses.USB_POST_PORTS_STATE]: () => true,
  [USBFeatureResponses.USB_ECHO]: () => true,
  [USBFeatureResponses.USB_POST_SPI_RESP]: (usbData: SPICommand) => knownSpiCommands[usbData],
  [USBFeatureResponses.USB_GOT_BEAN_CMD]: () => true,
  [USBFeatureResponses.USB_GOT_REC_TICKS]: () => true,
}

const processUsbEvent = ({
  event,
  dispatch,
  logKnownEvents,
}: {
  event: HIDInputReportEvent
  dispatch: any
  logKnownEvents: boolean
}) => {
  const usbEventId: keyof typeof knownEvents = event.data.getUint8(0);
  switch (usbEventId) {
    case USBFeatureResponses.USB_POST_PORTS_STATE:
      dispatch(setPins(new Array(9).fill(0).map((_, i) => event.data.getUint8(i)).slice(1)))
      break
    case USBFeatureResponses.USB_ECHO:
      dispatch(setEchoReceived(true))
      setTimeout(() => dispatch(setEchoReceived(false)), 1000)
      break
    case USBFeatureResponses.USB_GOT_BEAN_CMD:
      dispatch(
        log({
          message: 'BEAN received: '
            // Always display full bean command received as it may be erroneoues, so cannot relate on command length in first byte
            + (new Array(17)).fill(0)
              .map((_, i) => event.data.getUint8(i + 1).toString(16).toUpperCase())
              .join(' '),
        }))
      break
    case USBFeatureResponses.USB_GOT_REC_TICKS: {
      // Format:
      // For each pulse on BEAN 2 bytes are received:
      //  - 1st byte: 0bBccccccc
      //    where B - is prev BEAN state, c is cnt count, or number of bits received, 1 - 6
      //  - 2nd byte: 0brrrrrrrr
      //    where r - is remainder from cnt calc.
      //    cnt = TMR / T_CNT + (reminder > (3/4 * T_CNT) ? 1 : 0)
      //    reminder = TMR - (CNT * T_CNT)
      //    See getCntFromTmr from recBEAN in bean repo
      dispatch(
        log({
          message: <span>
            {new Array(event.data.byteLength).fill(0).map((_, i) => {
              // event.data.getUint8(i) is command
              if (i === 0) return <></>
              const d = event.data.getUint8(i)
              if (i % 2 === 1) {
                const bean = !!(d & 0b10000000)
                const cnt = d & 0b01111111
                return bean
                  ? <b style={{ color: 'green' }}>{cnt}</b>
                  : <b style={{ color: 'red' }}>{cnt}</b>
              }
              else return <>-{d.toString(16)}{' '}</>
            })}
          </span>,
        }))
      break
    }
    case USBFeatureResponses.USB_POST_SPI_RESP: {
      // SPI response format: |USB cmd|SPI rec: 2 bytes|SPI Sent cmd|
      const spiCommand: SPICommand = event.data.getUint8(9);
      switch (spiCommand) {
        case SPICommand.StatusRegRead:
          dispatch(setStatusReg(event.data.getUint8(2)))
          break
      }
      break
    }
  }
  if (logKnownEvents
    || !knownEvents[usbEventId]
    || !knownEvents[usbEventId](event.data.getUint8(9))) {
    dispatch(log({
      message: `RId: ${event.reportId}, L: ${event.data.byteLength}, Data: `
        + new Array(event.data.byteLength).fill(0).map((_, i) => event.data.getUint8(i).toString(16)).join(' '),
    }))
  }
}

export default processUsbEvent
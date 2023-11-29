import { SPICommand, USBFeatureResponses } from "./usbFeatureRequests";
import { addToSpiLog, setStatusReg } from "../redux/spiReducer";
import { log, setEchoReceived, setGlobalState, setPins } from "../redux/logsReducer";
import store from "../redux/store";
import { addCommand } from "../redux/beanReducer";

// const knownSpiCommands: { [key in SPICommand]?: boolean } = {
//   [SPICommand.StatusRegRead]: true,
//   [SPICommand.WriteDisable]: true,
//   [SPICommand.WriteEnable]: true,
// }

const knownEvents = {
  [USBFeatureResponses.USB_POST_PORTS_STATE]: () => true,
  [USBFeatureResponses.USB_ECHO]: () => true,

  [USBFeatureResponses.USB_POST_SPI_RESP]: () => true,
  [USBFeatureResponses.USB_POST_SPI_REGS]: () => true,

  [USBFeatureResponses.USB_GOT_BEAN_CMD]: () => true,
  [USBFeatureResponses.USB_GOT_REC_TICKS]: () => true,
  [USBFeatureResponses.USB_GOT_GLOBAL_STATE]: () => true,
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
    case USBFeatureResponses.USB_GOT_BEAN_CMD: {
      const cmd = (new Array(17)).fill(0).map((_, i) => event.data.getUint8(i + 1))
      // dispatch(
      //   log({
      //     message: 'BEAN received: '
      //       // Always display full bean command received as it may be erroneoues, so cannot relate on command length in first byte
      //       + cmd.map((b) => b.toString(16).toUpperCase()).join(' '),
      //   }))
      dispatch(addCommand(cmd));

      const ml = (cmd[0] & 0x0F) + 3;
      const isOtherData = cmd.slice(ml + 1).some(d => d);
      if (isOtherData) {
        dispatch(log({
          message: `After BEAN Cmd other data is present!: ${cmd.slice(ml + 1).map(d => d.toString(16)).join(' ')}`,
        }))
      }
      break
    }
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
    case USBFeatureResponses.USB_POST_SPI_RESP:
      // const spiCommand: SPICommand = event.data.getUint8(9);
      if (store.getState().spiReducer.isReadingSpiLog) {
        dispatch(addToSpiLog([event.data.getUint8(5), event.data.getUint8(6), event.data.getUint8(7), event.data.getUint8(8)]))
      }
      break
    case USBFeatureResponses.USB_POST_SPI_REGS:
      dispatch(setStatusReg(event.data.getUint8(2)))
      break
    case USBFeatureResponses.USB_GOT_GLOBAL_STATE: {
      // 1 - 4 bytes: spiAddr (uint32_t)
      const spiAddr = event.data.getUint8(4) + (event.data.getUint8(3) << 8) + (event.data.getUint8(2) << 16) + (event.data.getUint8(1) << 24)
      // ports are debounced ports
      const ports = event.data.getUint8(7);
      dispatch(setGlobalState({
        spiAddr,
        spiTask: event.data.getUint8(5),
        initialTasks: event.data.getUint8(6),

        buttonIn: !!(ports & 0b00000001),
        capotIn: !!(ports & 0b00000010),
        immoSenceIn: !!(ports & 0b00000100),
        asr12VIn: !!(ports & 0b00001000),

        buttonTest: event.data.getUint8(8),
        capotTest: event.data.getUint8(9),
        immoSenceTest: event.data.getUint8(10),
        asr12VTest: event.data.getUint8(11),

        ms10: event.data.getUint8(12) + (event.data.getUint8(13) << 8),
        min: event.data.getUint8(14),
        hour: event.data.getUint8(15),

        immoState: event.data.getUint8(16),
        immoInState: event.data.getUint8(17),
      }))
      break;
    }
  }
  if (logKnownEvents
    || !knownEvents[usbEventId]
    || !knownEvents[usbEventId]()) {
    dispatch(log({
      message: `RId: ${event.reportId}, L: ${event.data.byteLength}, Data: `
        + new Array(event.data.byteLength).fill(0).map((_, i) => event.data.getUint8(i).toString(16)).join(' '),
    }))
  }
}

export default processUsbEvent
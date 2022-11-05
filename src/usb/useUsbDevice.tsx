import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { log } from '../redux/logsReducer';
import { RootState } from '../redux/store';
import processUsbEvent from './processUsbEvent'

const vendorId = 0x04D8
const productId = 0x0032

const useUsbDevice = () => {
  const [device, setDevice] = useState<HIDDevice | undefined>(undefined)
  const dispatch: any = useDispatch()
  const logKnownEvents = useSelector((state: RootState) => state.logsReducer.logKnownEvents)

  const handleConnect = useCallback(async () => {
    try {
      const devices = await navigator.hid.requestDevice({
        filters: [{ vendorId, productId }],
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
      processUsbEvent({ event, dispatch, logKnownEvents })
    }
    device.addEventListener('inputreport', onInputReport)
    return () => {
      device.removeEventListener('inputreport', onInputReport)
    }

  }, [device, dispatch, logKnownEvents])

  const handleDisconnect = useCallback(async () => {
    if (device) {
      if (device.opened) await device.close()
      setDevice(undefined)
    }
  }, [device])

  useEffect(() => {
    const onconnect = ({ device }: HIDConnectionEvent) => {
      dispatch(log({ message: `HID connected: ${device.productName}` }));
    };
    navigator.hid.addEventListener('connect', onconnect)
    const ondisconnect = ({ device }: HIDConnectionEvent) => {
      handleDisconnect()
      dispatch(log({ message: `HID DISconnected: ${device.productName}` }));
    };
    navigator.hid.addEventListener('disconnect', ondisconnect)
    return () => {
      navigator.hid.removeEventListener('connect', onconnect)
      navigator.hid.removeEventListener('disconnect', ondisconnect)
    }
  }, [dispatch, handleDisconnect])

  return {
    handleConnect,
    handleDisconnect,
    device,
  }
}

export default useUsbDevice

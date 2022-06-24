import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { log } from '../redux/logsReducer';
import { USBFeatureRequests, USBSubCommand } from './usbFeatureRequests';

const useUsbSendFeatureRequest = (device: HIDDevice | undefined) => {
  const dispatch = useDispatch()

  return useCallback(async (req: USBFeatureRequests, subCmd?: USBSubCommand, data?: number[]) => {
    try {
      if (device && device.opened) {
        await device.sendReport(0, Uint8Array.from([req as number, subCmd as number].concat(data ? data : [])))
      }
    } catch (error: any) {
      dispatch(log({ message: error.message, isError: true }));
    }
  }, [device, dispatch])
}

export default useUsbSendFeatureRequest

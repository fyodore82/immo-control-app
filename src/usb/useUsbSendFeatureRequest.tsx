import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { log } from '../redux/logsReducer';
import { AppDispatch } from '../redux/store';
import { USBFeatureRequests, USBSubCommand } from './usbFeatureRequests';

export const handleUsbSendFeatureRequest = (dispatch: AppDispatch, device: HIDDevice | undefined) =>
  async (req: USBFeatureRequests, subCmd?: USBSubCommand, data?: number[]) => {
  try {
    if (device && device.opened) {
      await device.sendReport(0, Uint8Array.from([req as number, subCmd as number].concat(data ? data : [])))
    }
  } catch (error: any) {
    dispatch(log({ message: error.message, isError: true }));
  }
}

const useUsbSendFeatureRequest = (device: HIDDevice | undefined) => {
  const dispatch = useDispatch()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(handleUsbSendFeatureRequest(dispatch, device), [dispatch, device])
}

export default useUsbSendFeatureRequest

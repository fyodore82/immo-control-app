export const enum USBFeatureRequests {
  USB_NO_CMD = 0,
  USB_BEAN_DEBUG = 1,
  USB_SEND_BEAN = 2,
  USB_GET_PORTS_STATE = 3,

  USB_START_BOOTLOADER = 0x80,

  USB_ECHO = 0x90,
}

export const enum USBFeatureResponses {
  USB_NO_CMD = 0,
  USB_POST_PORTS_STATE = 3,

  USB_ECHO = 0x90,
}

export const enum USBSubCommand {
  USB_NO_SUBCMD = 0,
  BEAN_DEBUG_SET_1 = 1,
  BEAN_DEBUG_SET_0 = 2,
}

export const enum USBFeatureRequests {
  USB_NO_CMD = 0,
  // USB_BEAN_DEBUG = 1,
  USB_GET_PORTS_STATE = 2,
  USB_SET_PORT_STATE0 = 3,  // Data[0] = port number
  USB_SET_PORT_STATE1 = 4,
  USB_MONITOR_PORTS_STATE = 5,

  USB_SPI_SEND_CMD = 0x11,

  USB_SEND_BEAN_CMD = 0x21,
  USB_LISTERN_BEAN = 0x22,
  USB_SEND_BEAN_CMD_REC_TICKS = 0x23, // Save ticks elapsed between NEAN IN port change
  USB_LISTERN_BEAN_REC_TICKS = 0x24, // Save ticks elapsed between NEAN IN port change

  USB_START_BOOTLOADER = 0x80,

  USB_ECHO = 0x90,
}

export const enum USBFeatureResponses {
  USB_NO_CMD = 0,
  USB_POST_PORTS_STATE = 3,
  USB_POST_SPI_RESP = 0x11,

  USB_GOT_BEAN_CMD = 0x21,
  USB_GOT_REC_TICKS = 0x23,

  USB_ECHO = 0x90,
}

export const enum USBSubCommand {
  USB_NO_SUBCMD = 0,
  BEAN_DEBUG_SET_1 = 1,
  BEAN_DEBUG_SET_0 = 2,
}

// See LE25FU406B spec, Table 2, page 5
export const enum SPICommand {
  WriteEnable = 0x06,
  WriteDisable = 0x04,
  StatusRegRead = 0x05,
  StatusRegWrite = 0x01,

}

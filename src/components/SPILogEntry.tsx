import Box from "@mui/material/Box"
import { FC } from "react"
import { SPILogCmd, SPIState } from "../redux/spiReducer"

const spiLogCmdToName: { [spiLogCmd in SPILogCmd | 0xFF]: { name: string, backgroundColor: string } } = {
  [SPILogCmd.LOG_ENTRY_RESET]: { name: 'R', backgroundColor: 'lightgoldenrodyellow' },
  [SPILogCmd.LOG_ENTRY_STATE_CHANGE]: { name: 'SC', backgroundColor: 'lightgreen' },
  0xFF: { name: 'END OF LOG', backgroundColor: 'lightgreen' },
}

const getResetReason = (d1: number, d2: number) => {
  const Wrapper = (res: string) => <Box component='span' sx={{ border: '1px solid white' }}>{res}</Box>
  return (
    <>
      {[
        d1 & 0b00000010 && Wrapper('CM'),
        // d1 & 0b00000001 && 'VREGS', // Not a reset reason
        d2 & 0b10000000 && Wrapper('MCLR'),
        d2 & 0b01000000 && Wrapper('SW'),
        d2 & 0b00010000 && Wrapper('WD'),
        d2 & 0b00001000 && Wrapper('WFS'),
        d2 & 0b00000100 && Wrapper('WFI'),
        d2 & 0b00000010 && Wrapper('BO'),
        d2 & 0b00000001 && Wrapper('PO'),
      ].filter(Boolean)}
    </>
  )
}

const getPortInState = (d3: number) => (
  <>
    <Box component='span' sx={{ backgroundColor: d3 & 0b00001000 ? 'green' : 'red', color: 'white', border: '1px solid white' }}>AST12V</Box>
    <Box component='span' sx={{ backgroundColor: d3 & 0b00000100 ? 'green' : 'red', color: 'white', border: '1px solid white' }}>IMMO</Box>
    <Box component='span' sx={{ backgroundColor: d3 & 0b00000010 ? 'green' : 'red', color: 'white', border: '1px solid white' }}>CAPOT</Box>
    <Box component='span' sx={{ backgroundColor: d3 & 0b00000001 ? 'green' : 'red', color: 'white', border: '1px solid white' }}>BTN</Box>
  </>
)

const SPILogEntry: FC<{ log: SPIState['spiLog'][number] }> = ({ log: [addr, hour, min, sec, ms, cmd, d1, d2, d3] }) => {
  const { name, backgroundColor } = spiLogCmdToName[cmd as SPILogCmd] || {}
  const time = `${hour}:${min}:${sec}.${ms} - `
  return (
    <>
    0x{addr} -{' '}
    <Box component='span' sx={{ backgroundColor: backgroundColor || 'lightgray' }}>
      {time}
      {name || 'UNKNOWN'}{' '}
      {cmd === SPILogCmd.LOG_ENTRY_RESET && (
        getResetReason(d1, d2)
      )}
      {cmd === SPILogCmd.LOG_ENTRY_STATE_CHANGE && (
        getPortInState(d3)
      )}
    </Box>
    </>
  )
}

export default SPILogEntry
import Box from "@mui/material/Box";
import { FC } from "react";
import { SPILogCmd, SPIState } from "../redux/spiReducer";

const spiLogCmdToName: {
  [spiLogCmd in SPILogCmd | 0xff]: {
    name: string;
    backgroundColor: string;
    isEndOfLog: boolean;
  };
} = {
  [SPILogCmd.LOG_ENTRY_RESET]: {
    name: "R",
    backgroundColor: "#d2f4fa",
    isEndOfLog: false,
  },
  [SPILogCmd.LOG_ENTRY_STATE_CHANGE]: {
    name: "SC",
    backgroundColor: "#91b3f4",
    isEndOfLog: false,
  },
  [SPILogCmd.LOG_ENTRY_IMMO_IN_5S_DELAY]: {
    name: "5s",
    backgroundColor: "#91d3d4",
    isEndOfLog: false,
  },
  0xff: { name: "END OF LOG", backgroundColor: "lightgreen", isEndOfLog: true },
};

const getResetReason = (d1: number, d2: number) => {
  const Wrapper = (res: string) => (
    <Box component="span" sx={{ border: "1px solid #8c85d4" }}>
      {res}
    </Box>
  );
  return (
    <>
      {[
        d1 & 0b00000010 && Wrapper("CM"),
        // d1 & 0b00000001 && 'VREGS', // Not a reset reason
        d2 & 0b10000000 && Wrapper("MCLR"),
        d2 & 0b01000000 && Wrapper("SW"),
        d2 & 0b00010000 && Wrapper("WD"),
        d2 & 0b00001000 && Wrapper("WFS"),
        d2 & 0b00000100 && Wrapper("WFI"),
        d2 & 0b00000010 && Wrapper("BO"),
        d2 & 0b00000001 && Wrapper("PO"),
      ].filter(Boolean)}
    </>
  );
};

export const immoState: { [state: number]: { name: string; backgroundColor: string } } = {
  0: { name: "UNKNOWN", backgroundColor: "#cdccd5" },
  1: { name: "IMMO_OK_IMMO", backgroundColor: "#91f4a6" },
  2: { name: "IMMO_OK_ASR", backgroundColor: "#91f4a6" },
  3: { name: "IMMO_ALERT", backgroundColor: "#f4919d" },
};

export const immoInState: { [state: number]: { name: string; backgroundColor: string } } = {
  0: { name: "UNKNOWN", backgroundColor: "#cdccd5" },
  1: { name: "IMMO_IN_OK", backgroundColor: "#91f4a6" },
  2: { name: "IMMO_IN_ALERT", backgroundColor: "#f4919d" },
};

const getState = (d1: number, d2: number) => {
  const st = immoState[d1 & 0x0F]
  const inSt = immoState[(d1 & 0xF0) >> 4]
  return (
    <>
      <Box
        component="span"
        sx={{ border: "1px solid white", backgroundColor: inSt?.backgroundColor }}
      >
        {inSt?.name || '-'}
      </Box>
      <Box
        component="span"
        sx={{ border: "1px solid white", backgroundColor: st?.backgroundColor }}
      >
        {st?.name || '-'}
      </Box>
      <Box
        component="span"
        sx={{
          backgroundColor: d2 & 0b00000001 ? "green" : "red",
          color: "white",
          border: "1px solid white",
        }}
      >
        BtnLongPress
      </Box>
    </>
  );
};

const get5sTime = (d1: number, d2: number) => {
  return (
      <Box
        component="span"
        sx={{ border: "1px solid white", color: 'white', padding: '0 5px', backgroundColor: 'teal' }}
      >
        {((d1 << 8) + d2) * 10}ms
      </Box>
  )
}

const getPortInState = (d3: number) => (
  <>
    <Box
      component="span"
      sx={{
        backgroundColor: d3 & 0b00010000 ? "green" : "red",
        color: "white",
        border: "1px solid white",
      }}
    >
      IMMO_ON
    </Box>
    <Box
      component="span"
      sx={{
        backgroundColor: d3 & 0b00001000 ? "green" : "red",
        color: "white",
        border: "1px solid white",
      }}
    >
      AST12V
    </Box>
    <Box
      component="span"
      sx={{
        backgroundColor: d3 & 0b00000100 ? "green" : "red",
        color: "white",
        border: "1px solid white",
      }}
    >
      IMMO
    </Box>
    <Box
      component="span"
      sx={{
        backgroundColor: d3 & 0b00000010 ? "green" : "red",
        color: "white",
        border: "1px solid white",
      }}
    >
      CAPOT
    </Box>
    <Box
      component="span"
      sx={{
        backgroundColor: d3 & 0b00000001 ? "green" : "red",
        color: "white",
        border: "1px solid white",
      }}
    >
      BTN
    </Box>
  </>
);

const SPILogEntry: FC<{ log: SPIState["spiLog"][number] }> = ({
  log: [addr, hour, min, sec, ms, cmd, d1, d2, d3],
}) => {
  const { name, backgroundColor, isEndOfLog } =
    spiLogCmdToName[cmd as SPILogCmd] || {};
  const time = `${hour}:${min}:${sec}.${ms} - `;
  return (
    <>
      0x{addr} -{" "}
      <Box
        component="span"
        sx={{ backgroundColor: backgroundColor || "lightgray" }}
      >
        {time}
        {name || "UNKNOWN"}{" "}
        {!isEndOfLog &&
          cmd === SPILogCmd.LOG_ENTRY_RESET &&
          getResetReason(d1, d2)}
        {!isEndOfLog &&
          cmd === SPILogCmd.LOG_ENTRY_STATE_CHANGE &&
          getState(d1, d2)}
        {!isEndOfLog &&
          cmd === SPILogCmd.LOG_ENTRY_IMMO_IN_5S_DELAY &&
          get5sTime(d1, d2)}
        {!isEndOfLog && getPortInState(d3)}
      </Box>
    </>
  );
};

export default SPILogEntry;

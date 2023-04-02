import {
  Box,
  Button,
  LinearProgress,
  List,
  ListItem,
  TextField,
  Typography,
} from "@mui/material";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createStructuredSelector } from "reselect";
import { removeNonHexChars } from "../helpers/stringToByteArr";
import {
  clearSpiLog,
  readSpiLog,
  setEnteredStartAddr,
  setEndAddr,
} from "../redux/spiReducer";
import { RootState } from "../redux/store";
import useUsbSendFeatureRequest from "../usb/useUsbSendFeatureRequest";
import SPILogEntry from "./SPILogEntry";

type Props = {
  device: HIDDevice | undefined;
};

const selector = createStructuredSelector({
  spiLog: (state: RootState) => state.spiReducer.spiLog,
  isReadingSpiLog: (state: RootState) => state.spiReducer.isReadingSpiLog,

  startAddr: (state: RootState) => state.spiReducer.startAddr,
  enteredStartAddr: (state: RootState) => state.spiReducer.enteredStartAddr,
  endAddr: (state: RootState) => state.spiReducer.endAddr,
});

const ReadSPILogTab: FC<Props> = ({ device }) => {
  const sendUsbReq = useUsbSendFeatureRequest(device);
  const dispatch: any = useDispatch();
  const { spiLog, isReadingSpiLog, startAddr, endAddr, enteredStartAddr } = useSelector(selector);

  const [readPromise, setReadPromise] = useState<any>();

  const handleReadSpiLog = useCallback(async () => {
    if (readPromise) {
      readPromise.abort();
      setReadPromise(undefined);
    } else {
      dispatch(clearSpiLog());
      const promise = dispatch(readSpiLog({ sendUsbReq }));
      setReadPromise(promise);
      await promise;
      setReadPromise(undefined);
    }
  }, [dispatch, readPromise, sendUsbReq]);

  // const [progress, setPropgress] = useState<number>();

  const progress = useMemo(() => {
    if (!isReadingSpiLog) return 0;
    const wordsToRead =
      parseInt(endAddr || "7FFFF", 16) - parseInt(enteredStartAddr || '0', 16);
    const wordsRead = parseInt(endAddr || "7FFFF", 16) - parseInt(startAddr || '0', 16);
    return wordsRead / wordsToRead;
  }, [endAddr, enteredStartAddr, isReadingSpiLog, startAddr]);

  return (
    <Box display="flex" mr={2} ml={2} flex='1' minHeight={0}>
      <Box display="flex" flexDirection="column" mr={2} flexBasis="30%" ml={2}>
        <Button onClick={handleReadSpiLog} variant="outlined">
          {readPromise ? "Cancel Read" : "Read SPI Log"}
        </Button>
        <Box display="flex" flexDirection="row" mt={1} mb={1}>
          <TextField
            value={enteredStartAddr}
            onChange={(event) => {
              dispatch(
                setEnteredStartAddr(removeNonHexChars(event.target.value).slice(0, 6))
              );
            }}
            sx={{ width: "100%", marginRight: 1 }}
            label="start address"
          />
          <TextField
            value={endAddr}
            onChange={(event) => {
              dispatch(
                setEndAddr(removeNonHexChars(event.target.value).slice(0, 6))
              );
            }}
            sx={{ width: "100%" }}
            label="end address"
          />
        </Box>
        <Box display="flex" justifyContent="space-between">
          <LinearProgress
            sx={{ height: 20, marginBottom: 1, minWidth: "80%" }}
            variant="determinate"
            value={progress || 0}
          />
          {progress && Math.round(progress)} %
        </Box>
      </Box>
      <List
          sx={{ border: `1px solid black`, flex: "1 1 50%", overflow: "auto" }}
        >
          {spiLog.length === 0 && <ListItem>Log is empty</ListItem>}
          {spiLog.map((log, index) => (
            <ListItem key={index} sx={{ padding: `0 16px` }}>
              <SPILogEntry log={log} />
            </ListItem>
          ))}
        </List>
      <Box display='flex' flexDirection='column' ml={2}>
        <Typography>Legend</Typography>
        <Typography>R - reset occured</Typography>
        <Typography>CM - Configuration Mismatch</Typography>
        <Typography>MCLR - MCLR reset</Typography>
        <Typography>WD - Watch Dog</Typography>
        <Typography>WFS - Wake from Sleep</Typography>
        <Typography>WFI - Wake from Idle</Typography>
        <Typography>BO - Brown Out</Typography>
        <Typography>PO - Power On</Typography>
      </Box>
    </Box>
  );
};

export default ReadSPILogTab;

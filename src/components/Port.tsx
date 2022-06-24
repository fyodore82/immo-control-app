import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { FC } from "react";
import { LogsState } from "../redux/logsReducer";

const Port: FC<{ portName: keyof LogsState['ports'] | string, ports: any }> = ({
  portName,
  ports,
}) => (
  <Box
    sx={{
      width: 60,
      backgroundColor: ports[portName] === true ? 'lightgreen' : ports[portName] === false ? 'lightred' : 'lightgrey',
      textAlign: 'center',
    }}
  >
    <Typography variant='body2'>{portName.toUpperCase()}</Typography>
  </Box>
)

export default Port

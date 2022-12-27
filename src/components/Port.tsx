import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { FC } from "react";
import { LogsState } from "../redux/logsReducer";

const Port: FC<{
  portName: keyof LogsState['ports'] | string
  portState: boolean | undefined
}> = ({
  portName,
  portState,
}) => {
  return (
    <Box
      sx={{
        minWidth: 60,
        backgroundColor: portState === true ? 'lightgreen' : portState === false ? 'lightpink' : 'lightgrey',
        textAlign: 'center',
      }}
    >
      <Typography variant='body2' sx={{ whiteSpace: 'pre' }}>{portName.toUpperCase()}</Typography>
    </Box>
  )
}

export default Port

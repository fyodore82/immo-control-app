import { Button, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import { FC } from "react";

const TogglePort: FC<{
  onSetPort: (state: boolean | undefined) => void
  out?: true
  In?: true
}> = ({
  onSetPort,
  out,
  In,
}) => {
  return (
    <Box
      sx={{
        minWidth: 60,
        height: 20,
      }}
    >
      {out ? (
        <>
          <Button variant='contained' sx={{ padding: 0, height: 18 }} onClick={() => onSetPort(undefined)}>---</Button>
          <Button variant='contained' sx={{ padding: 0, height: 18 }} onClick={() => onSetPort(true)}>1</Button>
          <Button variant='contained' sx={{ padding: 0, height: 18 }} onClick={() => onSetPort(false)}>0</Button>
        </>
      ) : (
        <Typography variant='body2' sx={{ whiteSpace: 'pre' }}>{In ? '==>>' : ' '}</Typography>
      )}
    </Box>
  )
}

export default TogglePort

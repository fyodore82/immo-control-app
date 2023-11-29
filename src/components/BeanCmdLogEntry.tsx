import { Box } from "@mui/material";
import { FC, memo } from "react";

const BeanCmdLogEntry: FC<{ cmdArr: number[], count: number }> = ({ cmdArr, count }) => {
  const cmd = cmdArr.map((b) => `0${b.toString(16).toUpperCase()}`.slice(-2));
  const length = cmdArr[0] & 0x0F;
  return (
    <>
      {`00${count}`.slice(-3)}:{'  '}
      {cmd[0]}-
      <b>{cmd[1]}</b>-
      <b>{cmd[2]}</b>-
      {cmd.slice(3, length + 1).map((b, i) => (
        <Box component='span' key={i} sx={{ color: "green" }} fontWeight='bold'>
          {b}
        </Box>
      ))}
      -<b>{cmd[length + 1]}</b>-
      {cmd[length + 2]}
      {cmd[length + 3]}
    </>
  );
};

export default memo(BeanCmdLogEntry);

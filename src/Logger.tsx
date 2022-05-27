import List, { ListProps } from "@mui/material/List"
import ListItem from "@mui/material/ListItem"
import { FC } from "react"
import { useSelector } from "react-redux"
import { RootState } from "./redux/store"

const Logger: FC<ListProps> = (props) => {
  const logs = useSelector((state: RootState) => state.logsReducer)

  return (
    <List {...props}>
      {logs.length === 0 && <ListItem>Log is empty</ListItem>}
      {logs.map(log => (
        <ListItem
          key={log.dateTime}
        >
          {new Date(log.dateTime).toLocaleTimeString()}: {log.message}
        </ListItem>
      ))}
    </List>
  )
}

export default Logger

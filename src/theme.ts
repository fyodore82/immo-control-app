import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-input': {
            padding: 8,
          },
          // '& .MuiFormLabel-root': {
          //   // '& :not(.MuiInputLabel-shrink)': {
          //     transform: 'translate(8px, 8px) scale(1)',
          //   // },
          // },
        },
      },
    },
  },
})

export default theme
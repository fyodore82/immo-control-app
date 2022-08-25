export const stringToByteArr = (s: string): number[] => {
  return s.split(' ').reduce<number[]>((res, val) => {
    if (val.length <= 2) res.push(parseInt(val, 16))
    else {
      for (let i = 0; i < val.length; i += 2) {
        res.push(parseInt(val.slice(i, i + 2), 16))
      }
    }
    return res
  }, [])
}

// To remove characters that cannot be converted to hex
const validateByteString = /[^0-9|a-f|A-F| ]/gi

export const removeNonHexChars = (s: string): string => (
  s.replace(validateByteString, '')
)
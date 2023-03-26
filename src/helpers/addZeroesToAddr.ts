export const addZeroesToArr = (arr: number[], zCnt: number) => {
  // Fill byteArr with 0 up to zCnt bytes
  // OR remove bytes that are more than zCnt
  const st = Math.min(arr.length, zCnt)
  const del = Math.max(0, arr.length - zCnt)
  const add = Math.max(0, zCnt - arr.length)
  arr.splice(st, del, ...(new Array(add).fill(0)))
  return arr
}
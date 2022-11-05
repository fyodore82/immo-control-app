const Crc8 = (pcBlock: number[]) => {
  let crc = 0x00;
  for (let l = 0; l < pcBlock.length; l++) {
    crc ^= pcBlock[l];

    for (let i = 0; i < 8; i++) {
      crc = (crc & 0x80) ? (crc << 1) ^ 0x13 : crc << 1;
      crc &= 0xFF;
    }
  }

  return crc;
}

export default Crc8

// core/frameParser.js
export const extractFrames = (buffer, START1 = 0x94, START2 = 0xC3) => {
  const frames = [];
  let working = Buffer.from(buffer);

  while (working.length >= 4) {
    if (working[0] !== START1 || working[1] !== START2) {
      working = working.subarray(1);
      continue;
    }

    const frameLength = working.readUInt16BE(2);
    const totalLength = 4 + frameLength;

    if (frameLength < 1 || frameLength > 4096 || working.length < totalLength) break;

    frames.push(working.subarray(0, totalLength));
    working = working.subarray(totalLength);
  }

  return { frames, remainder: working };
};

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

    const frame = working.subarray(0, totalLength);
    const nextStart1 = working[totalLength];
    const nextStart2 = working[totalLength + 1];

    const isNextFrameAligned =
      nextStart1 === START1 && nextStart2 === START2;

    if (!isNextFrameAligned && working.length > totalLength + 1) {
      console.warn(
        `Framing warning: frame at offset 0x${buffer.length - working.length
          .toString(16)
          .padStart(4, '0')} ends cleanly, but next bytes are 0x${nextStart1?.toString(16)} 0x${nextStart2?.toString(16)}`
      );
    }

    frames.push(frame);
    working = working.subarray(totalLength);
  }

  return { frames, remainder: working };
};


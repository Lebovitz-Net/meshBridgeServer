// src/bridge/utils/decompressUtils.js
import lz4 from 'lz4';

export function decompress(buffer) {
  try {
    const output = Buffer.alloc(1024); // Adjust size based on expected payload
    const decompressedSize = lz4.decodeBlock(buffer, output);
    return output.slice(0, decompressedSize);
  } catch (err) {
    console.warn('[decompress] Failed to decompress LZ4 payload:', err);
    return null;
  }
}

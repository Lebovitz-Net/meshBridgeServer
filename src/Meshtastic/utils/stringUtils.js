// Meshtastic short name decoder in ES6


const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function stringToUnicodePoints(str) {
  const unicodePoints = Array.from(str).map(char => `U+${char.codePointAt(0).toString(16).toUpperCase()}`);
  return unicodePoints.join(" "); // Output: U+48 U+65 U+6C U+6C U+6F U+1F30D
}

export function decodePythonString(str) {
  // Check if the string contains Python-style hex escapes
  if (typeof str !== 'string') return str;
  const hexMatches = str.match(/\\x[0-9a-fA-F]{2}/g);

  if (hexMatches) {
    const byteValues = hexMatches.map(hex => parseInt(hex.replace("\\x", ""), 16));
    const utfBytes = new Uint8Array(byteValues);
    return new TextDecoder('utf-8').decode(utfBytes);
  } else {
    // Assume it's already a valid UTF-8 string
    return str;
  }
}

export function decodeRawUTF8(utfBytes) {
  return utfBytes;
}

function decodeVarint(buf, offset) {
  let result = 0;
  let shift = 0;
  let len = 0;

  while (true) {
    const byte = buf[offset + len];
    result |= (byte & 0x7F) << shift;
    len++;
    if ((byte & 0x80) === 0) break;
    shift += 7;
  }

  return [result, len];
}

function findFirstWireType(buffer) {
  for (let i = 0; i < buffer.length - 2; i++) {
    const byte = buffer[i];
    const wireType = byte & 0x07;
    const fieldNumber = byte >> 3;

    if (fieldNumber > 0 && wireType === 2) {
      try {
        const [length, lenBytes] = decodeVarint(buffer, i + 1);
        const totalLength = i + 1 + lenBytes + length;
        if (totalLength <= buffer.length) return i;
      } catch {
        continue;
      }
    }
  }
  return -1;
}

export function decodeNodeInfo(buffer) {
  if (!Buffer.isBuffer(buffer)) throw new Error('Expected a Buffer');

  const payloadStart = findFirstWireType(buffer);
  if (payloadStart === -1) throw new Error('No valid wire-type tag found');

  const nodeId = buffer.slice(0, payloadStart).toString('utf8');
  const payload = buffer.slice(payloadStart);

  const fields = {};
  let offset = 0;

  while (offset < payload.length) {
    const keyByte = payload[offset++];
    const fieldNumber = keyByte >> 3;
    const wireType = keyByte & 0x07;

    if (wireType !== 2) {
      fields[`field_${fieldNumber}`] = `(unsupported wireType ${wireType})`;
      break;
    }

    const [length, lenBytes] = decodeVarint(payload, offset);
    offset += lenBytes;

    const valueBuf = payload.slice(offset, offset + length);
    offset += length;

    let value;
    switch (fieldNumber) {
      case 1:
      case 4:
        value = valueBuf.toString('hex');
        break;
      case 2:
      case 3:
        value = valueBuf.toString('utf8');
        break;
      default:
        fields[`field_${fieldNumber}`] = `(uninterpreted field ${fieldNumber})`;
        continue;
    }

    fields[getFieldName(fieldNumber)] = value;
  }

  return {
    nodeId,
    ...fields,
  };
}

function getFieldName(n) {
  return {
    1: 'hexId',
    2: 'longName',
    3: 'shortName',
    4: 'signature',
  }[n] || `field_${n}`;
}

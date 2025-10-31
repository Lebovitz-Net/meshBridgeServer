export function isValidNodeId(id) {
  return id instanceof Uint8Array && id.length === 8;
}

export function nodeIdToHex(id) {
  return Array.from(id, b => b.toString(16).padStart(2, '0')).join('');
}

export function isValidUtf8String(str) {
  try {
    const encoded = new TextEncoder().encode(str);
    new TextDecoder('utf-8').decode(encoded);
    return true;
  } catch {
    return false;
  }
}

export function validateUserPacket(user, fromRadio = false) {
  const validId = isValidNodeId(user.id);
  const validShort = isValidUtf8String(user.shortName ?? '');
  const validLong = isValidUtf8String(user.longName ?? '');
  const hasName = (user.shortName?.length > 0 || user.longName?.length > 0);

  const valid = validId && hasName && validShort && validLong;
  const reason = !valid
    ? [
        !validId && 'invalid id',
        !hasName && 'missing name',
        !validShort && 'corrupted shortName',
        !validLong && 'corrupted longName'
      ].filter(Boolean).join(', ')
    : undefined;

  return {
    valid,
    reason,
    trust: fromRadio ? 'trusted' : 'unverified',
    idHex: validId ? nodeIdToHex(user.id) : null,
    shortName: validShort ? user.shortName : '[invalid utf8]',
    longName: validLong ? user.longName : '[invalid utf8]'
  };
}

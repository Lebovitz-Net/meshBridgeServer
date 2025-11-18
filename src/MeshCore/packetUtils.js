// ES6 implementation of a 32-bit FNV-1a hash
export const hashPublicKey = (publicKey) => {
  let hash = 0x811c9dc5; // FNV offset basis
  const prime = 0x01000193; // FNV prime

  for (const byte of publicKey) {
    hash ^= byte;
    hash = (hash * prime) >>> 0; // keep in 32-bit unsigned range
  }

  return hash;
};

export const getHexKey = (name) => {
    try {
        return getHexFromKey(repeaterContacts.get(name).publicKey);
    } catch (err) { return null };
};

export const getHexFromKey = (key) => {
    if (key instanceof String) {
        return  Uint8Array.from(Buffer.from(key, "hex"));
    }
}

export const getTextFromKey = (key) => {
    if (key instanceof Uint8Array) {
        return Array.from(key)
            .map(b => b.toString(16).padStart(2, '0').toUpperCase())
            .join('');
    }
}

export const getPublicKeyValue = (key) => {
    return key.reduce((acc, cur) => acc + cur, 0);
}
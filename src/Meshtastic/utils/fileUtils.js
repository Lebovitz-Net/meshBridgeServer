// utils/getCurrentFileName.js
import path from 'path';
import { fileURLToPath } from 'url';

const debugLogging = true;

/**
 * Returns the current file name (without extension) for ES Modules.
 * @param {string} metaUrl - Pass `import.meta.url` from the calling file.
 * @returns {string} - File name without extension.
 */
function getCurrentFileName(metaUrl) {
  const filePath = fileURLToPath(metaUrl);
  return path.basename(filePath, path.extname(filePath));
}

export const debugLogger = (metaUrl, ...args) => {
    if (debugLogging) {
        console.log(`[${getCurrentFileName(metaUrl)}]`,...args)
    }
};

export const debugLevelLogger = (metaUrl, level = 'info', ...args) => {
  if (!debugLogging) return;
  const file = getCurrentFileName(metaUrl);
  const prefix = `[${file}] [${level.toUpperCase()}]`;
  console[level === 'error' ? 'error' : 'log'](prefix, ...args);
};

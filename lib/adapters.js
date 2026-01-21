// Adapter system for dependency injection
// Allows React Native compatibility while maintaining Node.js backward compatibility

let fsAdapter = null;
let zlibAdapter = null;
let streamAdapter = null;
let BufferAdapter = null;

export function init({ fs, zlib, stream, Buffer }) {
  if (fs) fsAdapter = fs;
  if (zlib) zlibAdapter = zlib;
  if (stream) streamAdapter = stream;
  if (Buffer) BufferAdapter = Buffer;
}

export function getFS() {
  if (!fsAdapter) {
    throw new Error('FS adapter not initialized. Call init() with fs adapter first.');
  }
  return fsAdapter;
}

export function getZlib() {
  if (!zlibAdapter) {
    throw new Error('Zlib adapter not initialized. Call init() with zlib adapter first.');
  }
  return zlibAdapter;
}

export function getStream() {
  if (!streamAdapter) {
    throw new Error('Stream adapter not initialized. Call init() with stream adapter first.');
  }
  return streamAdapter;
}

export function getBuffer() {
  if (!BufferAdapter) {
    throw new Error('Buffer adapter not initialized. Call init() with Buffer adapter first.');
  }
  return BufferAdapter;
}

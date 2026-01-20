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
    fsAdapter = require('fs');
  }
  return fsAdapter;
}

export function getZlib() {
  if (!zlibAdapter) {
    zlibAdapter = require('zlib');
  }
  return zlibAdapter;
}

export function getStream() {
  if (!streamAdapter) {
    streamAdapter = require('stream');
  }
  return streamAdapter;
}

export function getBuffer() {
  if (!BufferAdapter) {
    BufferAdapter = typeof Buffer !== 'undefined' ? Buffer : require('buffer').Buffer;
  }
  return BufferAdapter;
}

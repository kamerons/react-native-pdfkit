import pkg from './package.json';
import { babel } from '@rollup/plugin-babel';
import copy from 'rollup-plugin-copy';
import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const external = [
  'stream',
  'fs',
  'zlib',
  'events',
  'linebreak',
  'crypto-js',
  'saslprep'
];

const supportedBrowsers = [
  'Firefox 102', // ESR from 2022
  'iOS 14', // from 2020
  'Safari 14' // from 2020
];

export default [
  // CommonJS build for Node
  {
    input: 'lib/document.js',
    external,
    output: {
      name: 'pdfkit',
      file: pkg.main,
      format: 'cjs',
      sourcemap: true,
      interop: false
    },
    plugins: [
      {
        name: 'resolve-vendor-fontkit',
        resolveId(id, importer) {
          if (id === '../vendor/fontkit/index.js' || id.endsWith('/vendor/fontkit/index.js')) {
            const resolved = resolve(__dirname, 'lib/vendor/fontkit/index.js');
            return resolved;
          }
          return null;
        }
      },
      nodeResolve(),
      json(),
      commonjs(),
      babel({
        babelHelpers: 'bundled',
        babelrc: false,
        presets: [
          [
            '@babel/preset-env',
            {
              modules: false,
              targets: {
                node: '18'
              }
            }
          ]
        ],
        comments: false
      }),
      copy({
        targets: [
          // Font files removed - caller provides them via init()
          // { src: ['lib/font/data/*.afm', 'lib/mixins/data/*.icc'], dest: 'js/data' },
        ]
      })
    ]
  },
  // ES for green browsers
  {
    input: 'lib/document.js',
    external,
    output: {
      name: 'pdfkit.es',
      file: pkg.module,
      format: 'es',
      sourcemap: true
    },
    plugins: [
      {
        name: 'resolve-vendor-fontkit',
        resolveId(id, importer) {
          if (id === '../vendor/fontkit/index.js' || id.endsWith('/vendor/fontkit/index.js')) {
            const resolved = resolve(__dirname, 'lib/vendor/fontkit/index.js');
            return resolved;
          }
          return null;
        }
      },
      nodeResolve(),
      json(),
      commonjs(),
      babel({
        babelHelpers: 'bundled',
        babelrc: false,
        presets: [
          [
            '@babel/preset-env',
            {
              modules: false,
              targets: {
                browsers: supportedBrowsers
              }
            }
          ]
        ],
        comments: false
      })
    ]
  },
  {
    input: 'lib/virtual-fs.js',
    external,
    output: {
      name: 'virtual-fs',
      file: 'js/virtual-fs.js',
      format: 'cjs',
      sourcemap: false
    },
    plugins: [
      babel({
        babelHelpers: 'bundled',
        babelrc: false,
        presets: [
          [
            '@babel/preset-env',
            {
              loose: true,
              modules: false,
              targets: {
                browsers: supportedBrowsers
              }
            }
          ]
        ]
      })
    ]
  }
];

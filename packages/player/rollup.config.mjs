import { nodeResolve } from '@rollup/plugin-node-resolve';
import { esbuild, litNode, minifyHTML } from '@vidstack/rollup';
import { globbySync } from 'globby';

const INPUT = ['src/index.ts', ...globbySync('src/define/*.ts')];
const EXTERNAL = [/@vidstack/, /node_modules\/@?lit/];
const CDN_EXTERNAL = ['hls.js'];

const PLUGINS = ({ dev = false } = {}) => [
  nodeResolve({ exportConditions: [dev ? 'development' : 'production'] }),
  esbuild({ define: { __DEV__: dev ? 'true' : 'false' } }),
  !dev && minifyHTML({ include: /(styles|Element)\.(js|ts)/ }),
];

/** @returns {import('rollup').OutputOptions} */
const ESM_OUTPUT = ({ dir = '' }) => ({
  format: 'esm',
  dir,
  preserveModules: true,
  preserveModulesRoot: 'src',
});

/** @type {import('rollup').RollupOptions} */
const DEV = {
  input: INPUT,
  output: ESM_OUTPUT({ dir: 'dist/dev' }),
  preserveEntrySignatures: 'allow-extension',
  external: EXTERNAL,
  plugins: PLUGINS({ dev: true }),
};

/** @type {import('rollup').RollupOptions} */
const PROD = {
  input: INPUT,
  output: ESM_OUTPUT({ dir: 'dist/prod' }),
  preserveEntrySignatures: 'allow-extension',
  external: EXTERNAL,
  plugins: PLUGINS(),
};

/** @type {import('rollup').RollupOptions} */
const NODE = {
  input: INPUT,
  output: {
    dir: 'dist/node',
    format: 'esm',
    entryFileNames(chunk) {
      if (/src\/define/.test(chunk.facadeModuleId ?? '')) {
        return `define/${chunk.name}.js`;
      }

      return `${chunk.name}.js`;
    },
    chunkFileNames(chunk) {
      return `shared/${chunk.name}.js`;
    },
  },
  preserveEntrySignatures: 'allow-extension',
  external: ['@vidstack/foundation'],
  plugins: [...PLUGINS(), litNode()],
};

/** @type {import('rollup').RollupOptions} */
const CDN_BUNDLE = {
  input: 'src/define/dangerously-all.ts',
  output: {
    file: 'dist/cdn/bundle.js',
    format: 'esm',
  },
  external: CDN_EXTERNAL,
  plugins: PLUGINS(),
};

/** @type {import('rollup').RollupOptions} */
const CDN_DEFINE = {
  input: globbySync('src/define/*.ts'),
  output: {
    dir: 'dist/cdn/define',
    format: 'esm',
  },
  external: CDN_EXTERNAL,
  preserveEntrySignatures: 'allow-extension',
  plugins: PLUGINS(),
};

export default [DEV, PROD, NODE, CDN_BUNDLE, CDN_DEFINE];

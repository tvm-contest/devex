import serve from 'rollup-plugin-serve';
import copy from 'rollup-plugin-copy';
import watchAssets from 'rollup-plugin-watch-assets';
import postcss from 'rollup-plugin-postcss';
import svelte from 'rollup-plugin-svelte';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import json from '@rollup/plugin-json';
import livereload from 'rollup-plugin-livereload';
import preprocess from 'svelte-preprocess';
import replace from '@rollup/plugin-replace';

const production = !process.env.ROLLUP_WATCH;

const config = [{
  input: 'src/debot-browser/debot.js',
  output: {
    file: 'dist/debot-browser/debot.js',
    name: 'debot',
    format: 'iife'
  },
  plugins: [
    svelte({
      emitCss: true,
      preprocess: preprocess()
    }),
    // add the postccs plugin
    postcss({
      extract: true,
      minimize: production,
      sourceMap: !production
    }),
    copy({
      targets: [
        { src: 'src/debot-browser/*.html', dest: 'dist/debot-browser/' },
        { src: 'src/debot-browser/assets', dest: 'dist/debot-browser/' },
        { src: './node_modules/@tonclient/lib-web/tonclient.wasm', dest: 'dist/debot-browser/' }
      ]
    }),
    commonjs(),
    json(),
    !production && copy({targets: [{ src: 'tools/chromereload.js', dest: 'dist/debot-browser/' }]}),
    !production && copy({targets: [{ src: './node_modules/livereload-js/dist/livereload.js', dest: 'dist/debot-browser/' }]}),
    !production && serve({open: true, contentBase: 'dist/', port: 10002}) && livereload({watch: 'dist/', verbose: false}),
    !production && watchAssets({ assets: ['src/debot-browser'] }),
    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser(),
    resolve({ browser: true, preferBuiltins: false }),
    replace({
      preventAssignment: true,
      values: {
        '__DEV_MODE__': !production,
        '__CDN_URL__': (!production ? 'http://localhost:10002/debot-browser' : 'https://cdn.jsdelivr.net/gh/mytonwallet/debot-web-embedding@master/dist/debot-browser')
      }
    }),
  ],
  watch: {
    clearScreen: false
  }
},
{
  input: 'src/embed-tool/embedtool.js',
  output: {
    file: 'dist/embed-tool/embedtool.js',
    name: 'embedtool',
    format: 'iife'
  },
  plugins: [
    svelte({
      emitCss: true,
      preprocess: preprocess()
    }),
    // add the postccs plugin
    postcss({
      extract: true,
      minimize: production,
      sourceMap: !production
    }),
    copy({
      targets: [
        { src: 'src/embed-tool/*.html', dest: 'dist/embed-tool/' },
        { src: 'src/embed-tool/assets', dest: 'dist/embed-tool/' }
      ]
    }),
    commonjs(),
    json(),
    !production && copy({targets: [{ src: 'tools/chromereload.js', dest: 'dist/embed-tool/' }]}),
    !production && copy({targets: [{ src: './node_modules/livereload-js/dist/livereload.js', dest: 'dist/embed-tool/' }]}),
    !production && watchAssets({ assets: ['src/embed-tool'] }),
    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser(),
    resolve({ browser: true, preferBuiltins: false }),
    replace({
      preventAssignment: true,
      values: {
        '__DEV_MODE__': !production,
        '__CDN_URL__': (!production ? 'http://localhost:10002/debot-browser' : 'https://cdn.jsdelivr.net/gh/mytonwallet/debot-web-embedding@master/dist/debot-browser')
      }
    }),
  ],
  watch: {
    clearScreen: false
  }
}];

export default config;

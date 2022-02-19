import commonjs from '@rollup/plugin-commonjs'
import dts from 'rollup-plugin-dts'
import resolve from '@rollup/plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'

const production = !process.env.ROLLUP_WATCH

export default [
  {
    input: 'dist/esm/index.js',
    output: {
      format: 'esm',
      sourcemap: true,
      file: 'index.esm.js'
    },
    plugins: [
      resolve({
        browser: false
      }),

      commonjs({ include: 'node_modules/**', extensions: ['.js', '.ts'] }),

      // production && terser(),
    ]
  },
  {
    input: 'dist/esm/index.d.ts',
    output: {
      file: 'index.esm.d.ts'
    },
    plugins: [dts()]
  }
]

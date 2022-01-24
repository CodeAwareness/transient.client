import commonjs from '@rollup/plugin-commonjs'
import dts from 'rollup-plugin-dts'
import resolve from '@rollup/plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'

const production = !process.env.ROLLUP_WATCH

export default [
  {
    input: 'dist/index.js',
    output: {
      file: 'index.js'
    },
    plugins: [
      resolve({
        browser: true
      }),

      commonjs({ include: 'node_modules/**', extensions: ['.js', '.ts'] }),

      production && terser(),
    ]
  },
  {
    input: 'dist/index.d.ts',
    output: {
      file: 'index.d.ts'
    },
    plugins: [dts()]
  }
]

'use strict'

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const year = new Date().getFullYear()
const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'))

const stampTop =
`/*!
  * Simple-Jekyll-Search v${packageJson.version}
  * Copyright 2015-2022, Christian Fei
  * Copyright 2025-${year}, Sylhare
  * Licensed under the MIT License.
  */
`

const leadingBanner = /^\/\*!([\s\S]*?)\*\/\s*/

/**
 * Prepends the license banner, replacing any banner already at the top of the input.
 * Idempotent: stamping an already-stamped bundle re-stamps rather than stacking, so
 * running the postbuild step twice (npm auto-runs post hooks, yarn does not) is harmless.
 */
export function stamp (input) {
  let code = input
  for (let match = leadingBanner.exec(code); match !== null; match = leadingBanner.exec(code)) {
    if (!match[1].includes('Simple-Jekyll-Search')) break
    code = code.slice(match[0].length)
  }
  return stampTop + code
}

const isMain = process.argv[1] !== undefined && resolve(process.argv[1]) === __filename

if (isMain) {
  let input = ''
  process.stdin.on('data', chunk => {
    input += chunk
  })

  process.stdin.on('end', () => {
    process.stdout.write(stamp(input))
  })
}

'use strict'

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

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

let input = ''
process.stdin.on('data', chunk => {
  input += chunk
})

process.stdin.on('end', () => {
  const output = stampTop + input
  process.stdout.write(output)
})

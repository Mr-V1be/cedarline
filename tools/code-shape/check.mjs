#!/usr/bin/env node
// Code-shape gate: every handwritten source file stays within the line limit and
// every folder holds a bounded number of direct source files. Generated code is
// listed explicitly in config.json so that exemptions are visible in review.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '../..')
const config = JSON.parse(readFileSync(path.join(here, 'config.json'), 'utf8'))

/** Converts a repository glob (supports `**`, `*`, `?`) into an anchored RegExp. */
function globToRegExp(glob) {
  let pattern = ''
  for (let index = 0; index < glob.length; index += 1) {
    const char = glob[index]
    if (char === '*' && glob[index + 1] === '*') {
      const followedBySlash = glob[index + 2] === '/'
      pattern += followedBySlash ? '(?:.*/)?' : '.*'
      index += followedBySlash ? 2 : 1
    } else if (char === '*') {
      pattern += '[^/]*'
    } else if (char === '?') {
      pattern += '[^/]'
    } else {
      pattern += char.replace(/[.+^${}()|[\]\\]/g, '\\$&')
    }
  }
  return new RegExp(`^${pattern}$`)
}

const generatedMatchers = config.generated.map(globToRegExp)
const sourceGlobMatchers = config.sourceGlobs.map(globToRegExp)

const isGenerated = (file) => generatedMatchers.some((matcher) => matcher.test(file))
const isSource = (file) =>
  config.sourceExtensions.includes(path.extname(file)) ||
  sourceGlobMatchers.some((matcher) => matcher.test(file))

const listed = execFileSync(
  'git',
  ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
  { cwd: repoRoot, encoding: 'utf8' },
)
  .split('\0')
  .filter(Boolean)

const sourceFiles = listed.filter((file) => isSource(file) && !isGenerated(file))
const violations = []

for (const file of sourceFiles) {
  let content
  try {
    content = readFileSync(path.join(repoRoot, file), 'utf8')
  } catch {
    continue // listed by git but deleted in the working tree
  }
  const lines = content.endsWith('\n') ? content.split('\n').length - 1 : content.split('\n').length
  if (lines > config.maxFileLines) {
    violations.push(`${file}: ${lines} lines (limit ${config.maxFileLines})`)
  }
}

const filesPerFolder = new Map()
for (const file of sourceFiles) {
  const folder = path.posix.dirname(file)
  filesPerFolder.set(folder, (filesPerFolder.get(folder) ?? 0) + 1)
}
for (const [folder, count] of filesPerFolder) {
  if (count > config.maxSourceFilesPerFolder) {
    violations.push(`${folder}/: ${count} source files (limit ${config.maxSourceFilesPerFolder})`)
  }
}

if (violations.length > 0) {
  console.error(`Code-shape gate failed (${violations.length}):`)
  for (const violation of violations) console.error(`  - ${violation}`)
  process.exit(1)
}
console.log(
  `Code-shape gate passed: ${sourceFiles.length} source files, ${filesPerFolder.size} folders.`,
)

/* eslint-env node, browser */
import Hash from 'utils/sha1'
import { toHex } from 'utils/toHex'

let supportsSubtleSHA1 = false

export async function shasum(buffer) {
  if (supportsSubtleSHA1 === null) {
    supportsSubtleSHA1 = await testSubtleSHA1()
  }
  return supportsSubtleSHA1 ? subtleSHA1(buffer) : shasumSync(buffer)
}

// This is modeled after @dominictarr's "shasum" module,
// but without the 'json-stable-stringify' dependency and
// extra type-casting features.
function shasumSync(buffer) {
  return toHex(new Hash().update(buffer).digest())
}

async function subtleSHA1(buffer) {
  const hash = await crypto.subtle.digest('SHA-1', buffer)
  return toHex(hash)
}

async function testSubtleSHA1() {
  // I'm using a rather crude method of progressive enhancement, because
  // some browsers that have crypto.subtle.digest don't actually implement SHA-1.
  try {
    const hash = await subtleSHA1(new Uint8Array([]))
    if (hash === 'da39a3ee5e6b4b0d3255bfef95601890afd80709') return true
  } catch (_) {
    // no bother
  }
  return false
}

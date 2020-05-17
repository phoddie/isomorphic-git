/* global globalThis */

// process.domain shim (used by 'async-lock'?!)
globalThis.process = Object.freeze({ domain: null })

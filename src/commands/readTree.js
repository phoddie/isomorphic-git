// @ts-check
import 'typedefs'

import { resolveFilepath } from '../utils/resolveFilepath.js'
import { resolveTree } from '../utils/resolveTree.js'

/**
 *
 * @typedef {Object} ReadTreeResult - The object returned has the following schema:
 * @property {string} oid - SHA-1 object id of this tree
 * @property {TreeObject} tree - the parsed tree object
 */

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {string} args.gitdir
 * @param {string} args.oid
 * @param {string} [args.filepath]
 *
 * @returns {Promise<ReadTreeResult>}
 */
export async function _readTree({ fs, gitdir, oid, filepath = undefined }) {
  if (filepath !== undefined) {
    oid = await resolveFilepath({ fs, gitdir, oid, filepath })
  }
  const { tree, oid: treeOid } = await resolveTree({ fs, gitdir, oid })
  const result = {
    oid: treeOid,
    tree: tree.entries(),
  }
  return result
}

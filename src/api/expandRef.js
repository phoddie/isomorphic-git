// @ts-check
import 'typedefs'

import { GitRefManager } from 'managers/GitRefManager'
import { join } from 'utils/join'

import { FileSystem } from '../models/FileSystem.js'
import { assertParameter } from '../utils/assertParameter.js'

/**
 * Expand an abbreviated ref to its full name
 *
 * @param {Object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.ref - The ref to expand (like "v1.0.0")
 *
 * @returns {Promise<string>} Resolves successfully with a full ref name ("refs/tags/v1.0.0")
 *
 * @example
 * let fullRef = await git.expandRef({ fs, dir: '/tutorial', ref: 'master'})
 * console.log(fullRef)
 *
 */
export async function expandRef({ fs, dir, gitdir = join(dir, '.git'), ref }) {
  try {
    assertParameter('fs', fs)
    assertParameter('gitdir', gitdir)
    assertParameter('ref', ref)
    return await GitRefManager.expand({
      fs: new FileSystem(fs),
      gitdir,
      ref,
    })
  } catch (err) {
    err.caller = 'git.expandRef'
    throw err
  }
}

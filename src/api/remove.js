// @ts-check
import 'typedefs'

import { GitIndexManager } from 'managers/GitIndexManager'
import { join } from 'utils/join'

import { FileSystem } from '../models/FileSystem.js'
import { assertParameter } from '../utils/assertParameter.js'

/**
 * Remove a file from the git index (aka staging area)
 *
 * Note that this does NOT delete the file in the working directory.
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir, '.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.filepath - The path to the file to remove from the index
 *
 * @returns {Promise<void>} Resolves successfully once the git index has been updated
 *
 * @example
 * await git.remove({ fs, dir: '/tutorial', filepath: 'README.md' })
 * console.log('done')
 *
 */
export async function remove({
  fs: _fs,
  dir,
  gitdir = join(dir, '.git'),
  filepath,
}) {
  try {
    assertParameter('fs', _fs)
    assertParameter('gitdir', gitdir)
    assertParameter('filepath', filepath)

    const cache = {}
    await GitIndexManager.acquire(
      { fs: new FileSystem(_fs), gitdir, cache },
      async function(index) {
        index.delete({ filepath })
      }
    )
  } catch (err) {
    err.caller = 'git.remove'
    throw err
  }
}

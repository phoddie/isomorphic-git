import { GitTree } from 'models/GitTree'
import { _readObject as readObject } from 'storage/readObject'
import { join } from 'utils/join'

import { GitAnnotatedTag } from '../models/GitAnnotatedTag.js'
import { GitCommit } from '../models/GitCommit.js'

export async function listObjects({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  oids,
}) {
  const visited = new Set()
  // We don't do the purest simplest recursion, because we can
  // avoid reading Blob objects entirely since the Tree objects
  // tell us which oids are Blobs and which are Trees.
  async function walk(oid) {
    visited.add(oid)
    const { type, object } = await readObject({ fs, gitdir, oid })
    if (type === 'tag') {
      const tag = GitAnnotatedTag.from(object)
      const obj = tag.headers().object
      await walk(obj)
    } else if (type === 'commit') {
      const commit = GitCommit.from(object)
      const tree = commit.headers().tree
      await walk(tree)
    } else if (type === 'tree') {
      const tree = GitTree.from(object)
      for (const entry of tree) {
        // only add blobs and trees to the set,
        // skipping over submodules whose type is 'commit'
        if (entry.type === 'blob' || entry.type === 'tree') {
          visited.add(entry.oid)
        }
        // only recurse for trees
        if (entry.type === 'tree') {
          await walk(entry.oid)
        }
      }
    }
  }
  // Let's go walking!
  for (const oid of oids) {
    await walk(oid)
  }
  return visited
}

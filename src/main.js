/* eslint-disable import/order */
/* global trace Application Column Label Skin Style Scroller Text Behavior */

import config from 'mc/config'
import Net from 'net'

// UI stuff
import {} from 'piu/MC'
import { VerticalScrollerBehavior } from 'scroller'

// Globals used by isomorphic-git
import 'console'
import 'buffer'

// isomorphic-git functions
import { clone } from 'api/clone'

// isomorphic-git clients
import fs from 'fs/moddable'
import http from 'http/moddable'

// Main code
const dir = config.file.root + 'tmp/moddable-test'

const userAgent = 'git/isomorphic-git moddable-branch'

const HomeScreen = Column.template($ => ({
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  skin: new Skin({ fill: 'blue' }),
  contents: [
    Label(null, {
      top: 0,
      height: 40,
      left: 0,
      right: 0,
      string: $.title,
      style: new Style({
        font: 'semibold 16px Open Sans',
        vertical: 'middle',
        horizontal: 'center',
        color: '#FFFFFF',
      }),
    }),
    new Scroller(null, {
      anchor: 'VSCROLLER',
      scroll: $.scroll,
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      active: true,
      backgroundTouch: true,
      clip: true,
      Behavior: VerticalScrollerBehavior,
      skin: new Skin({ fill: 'white' }),
      contents: [
        Text(null, {
          top: 0,
          left: 0,
          right: 0,
          style: new Style({
            font: '16px Open Sans',
            vertical: 'middle',
            horizontal: 'left',
            color: '#000000',
          }),
          string: $.string,
        }),
      ],
    }),
  ],
}))

class ApplicationBehavior extends Behavior {
  onCreate(application) {
    this.doNext(application, 'HOME', {
      title: 'hello world',
      string: Net.get('IP'),
    })
  }

  setTitle(title) {
    const label = application.first.content(0)
    label.string = title
  }

  setBody(string) {
    const scroller = application.first.content(1)
    const text = scroller.first
    text.string = string
    if (string) trace(string, '\n')
  }

  doNext(application, nextScreenName, nextScreenData = {}) {
    application.defer('onSwitchScreen', nextScreenName, nextScreenData)
  }

  onSwitchScreen(application, nextScreenName, nextScreenData = {}) {
    if (application.length) application.remove(application.first)
    application.purge()
    switch (nextScreenName) {
      case 'HOME':
        application.add(new HomeScreen(nextScreenData))
        doStuff(application)
        break
    }
  }
}
Object.freeze(ApplicationBehavior.prototype)

async function doStuff() {
  trace(`IP address ${Net.get('IP')}\n`)

  trace('DELETING OLD FILES\n')
  let string = ''
  application.behavior.setTitle('deleting files...')
  const _dir = dir + '/'
  // depth first recursive delete
  let rmrf = async dir => {
    try {
      const entries = await fs.promises.readdir(dir)
      for (const entry of entries) {
        await rmrf(`${dir}/${entry}`)
      }
      await fs.promises.rmdir(dir)
      string += `${dir.replace(_dir, '')} `
      application.behavior.setBody(string)
    } catch (e) {
      await fs.promises.unlink(dir)
      string += `${dir.replace(_dir, '')} `
      application.behavior.setBody(string)
    }
  }

  try {
    await rmrf(dir);
    rmrf = undefined;
    string = undefined
  } catch (e) {
    trace(e.message)
    debugger
  }

  trace('MAIN - CLONE\n')
  let phases = {
    msg: '',
  }
  application.behavior.setBody('')
  application.behavior.setTitle('cloning...')
  try {
    await clone({
      fs,
      http,
      dir,
      url: 'https://github.com/wmhilton/select-case',
      depth: 1,
      singleBranch: true,
      headers: {
        'User-Agent': userAgent,
      },
      onMessage(msg) {
        if (msg.includes('(')) return
        phases.msg += msg + '\n'
        application.behavior.setBody(Object.values(phases).join('\n'))
      },
      onProgress(val) {
        phases[val.phase] = `${val.phase}... ${val.loaded} of ${val.total || 'unknown'}`
        application.behavior.setBody(Object.values(phases).join('\n'))
      },
    })
  } catch (err) {
    trace(err.message)
    debugger
  }

  application.behavior.setTitle('clone complete')
  phases.final = await fs.promises.readFile(dir + '/README.md', 'utf8')
  application.behavior.setBody(Object.values(phases).join('\n'))
  phases = undefined
  trace('MAIN - EXIT\n')
}

export default function() {
  trace(`Working directory: ${dir}\n`)

  return new Application(null, {
    displayListLength: 5096,
    commandListLength: 2048,
    touchCount: 1,
    Behavior: ApplicationBehavior,
  })
}

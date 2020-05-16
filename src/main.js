// console.log shim
globalThis.console = class {
	static log(msg) {
		trace(msg, "\n");
	}
}

import http from "http/moddable"
import fs from "fs/moddable"

import { addRemote } from 'api/addRemote'
import { checkout } from 'api/checkout'
import { currentBranch } from 'api/currentBranch'
import { fetch } from 'api/fetch'
import { getRemoteInfo } from 'api/getRemoteInfo'
import { init } from 'api/init'
import { ModdableBuffer } from 'utils/ModdableBuffer'

import {} from 'piu/MC'
import config from "mc/config";
import Net from 'net'
import WiFi from 'wifi'
import Preference from 'preference'
import { System, File } from 'file'
import { VerticalScrollerBehavior } from 'scroller'

// console.log(`maxPathLength=${System.config().maxPathLength}`)
// console.log(`config.file.root=${config.file.root}`)
//
// const ROOT = config.file.root
//
// await fs.promises.writeFile(`${ROOT}/hello.txt`, 'Hello World\n', 'utf8')
// await init({ fs, dir: ROOT })
// console.log(JSON.stringify(await fs.promises.readdir(ROOT)))

// ATTN: UNCOMMENT THESE LINES TO SAVE YOUR WIFI INFORMATION TO SPI FLASH MEMORY
// if (config.wifi) {
// 	Preference.set('wifi', 'ssid', 'PUT_YOUR_SSID_HERE');
// 	Preference.set('wifi', 'password', 'PUT_YOUR_WIFI_PASSWORD_HERE');
// }

// Buffer shim
globalThis.Buffer = ModdableBuffer

// process.domain shim (used by 'async-lock'?!)
globalThis.process = Object.freeze({domain: null});

const dir = config.file.root + "tmp/moddable-test"

// Main code
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
    global.application = application
    this.doNext(application, 'HOME', { title: 'hello world', string: Net.get('IP') })
  }

  setTitle(title) {
	  let label = application.first.content(0);
	  label.string = title;
  }
  setBody(string) {
    let scroller = application.first.content(1);
    let text = scroller.first;
    text.string = string;
    if (string)
		console.log(string)
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
        break
    }
  }
}
Object.freeze(ApplicationBehavior.prototype)

async function doStuff () {
	trace(`IP address ${Net.get('IP')}\n`)
//	string = `IP address ${Net.get('IP')}\n`
	let result = await getRemoteInfo({
		http,
		corsProxy: config.proxy && 'http://localhost:9998',
		/* this is interesting:
		date validation failed on received certificate
	/Users/wmhilton/code/Moddable-OpenSource/moddable/modules/crypt/ssl/ssl_handshake.js (495) # Exception: throw!

		Got another one:
		/Users/wmhilton/code/Moddable-OpenSource/moddable/modules/crypt/ssl/ssl_alert.js (82) # Exception: throw!

		both times on Mac btw.
	*/
		url: 'https://github.com/isomorphic-git/test.empty.git',
		headers: {
			'User-Agent': userAgent
		}
	})

	application.behavior.setBody(JSON.stringify(result, null, 2));
	result = undefined;

	if (!config.fs) {
		return
	}

trace("MAIN - INIT\n");
	await init({
		fs,
		dir,
	})
	let files = await fs.promises.readdir(dir + "/.git");
	// should print:
	// [
	//   "config",
	//   "objects",
	//   "HEAD",
	//   "info",
	//   "hooks",
	//   "refs"
	// ]
	application.behavior.setTitle('init');
	application.behavior.setBody(JSON.stringify(files, null, 2));
	files = undefined;

trace("MAIN - ADDREMOTE\n");

	await addRemote({
		fs,
		dir,
		remote: 'origin',
		url: 'https://github.com/isomorphic-git/test.empty.git',
		force: true,
	})

trace("MAIN - CURRENTBRANCH\n");
	let branch = await currentBranch({
		fs,
		dir,
	})
	// should print "master"
	application.behavior.setTitle('currentBranch');
	application.behavior.setBody(JSON.stringify(branch, null, 2));
	branch = undefined;

	// This should create a packfile and a packfile index in
	// /tmp/moddable-test/.git/objects/pack
trace("MAIN - FETCH\n");
	application.behavior.setTitle('fetch...');
	application.behavior.setBody('');
	let fetchResult = await fetch({
		http,
		fs,
		corsProxy: config.proxy && 'http://localhost:9998',
		dir,
		onMessage (msg) {
			console.log(msg)
			string += msg;
		},
	})
	// should print something like:
	// {
	//   "defaultBranch": "refs/heads/test",
	//   "fetchHead": "5a8905a02e181fe1821068b8c0f48cb6633d5b81",
	//   "fetchHeadDescription": "branch 'HEAD' of https://github.com/isomorphic-git/test.empty.git",
	//   "headers": {
	//     "access-control-allow-origin": "*",
	//     "access-control-expose-headers": "accept-ranges,age,cache-control,content-length,content-language,content-type,date,etag,expires,last-modified,pragma,server,transfer-encoding,vary,x-github-request-id,x-redirected-url",
	//     "cache-control": "no-cache, max-age=0, must-revalidate",
	//     "content-type": "application/x-git-upload-pack-result",
	//     "expires": "Fri, 01 Jan 1980 00:00:00 GMT",
	//     "pragma": "no-cache",
	//     "server": "GitHub Babel 2.0",
	//     "transfer-encoding": "chunked",
	//     "vary": "Accept-Encoding",
	//     "x-github-request-id": "DF37:64AB:5FDD:C010:5EB07590",
	//     "date": "Mon, 04 May 2020 20:05:37 GMT",
	//     "connection": "close"
	//   },
	//   "packfile": "objects/pack/pack-FB367774AD41ABBFDC2F4BE55149F57987E47EEA.pack"
	// }
	application.behavior.setTitle('fetch');
	application.behavior.setBody(JSON.stringify(fetchResult, null, 2));

	const { defaultBranch } = fetchResult
	fetchResult = undefined;
	const ref = defaultBranch.replace('refs/heads/', '')
	application.behavior.setTitle('checkout...');
	application.behavior.setBody('');
	let phase = ''
	let strings = []
	try {
trace("MAIN - CHECKOUT\n");
		await checkout({
			fs,
			dir,
			ref,
			onProgress (val) {
				console.log(JSON.stringify(val))
				if (val.phase !== phase) {
					strings.push(`${val.phase}... ${val.loaded} of ${val.total || 'unknown'}`)
				} else {
					strings[strings.length - 1] = `${val.phase}... ${val.loaded} of ${val.total || 'unknown'}`
				}
				phase = val.phase
				application.behavior.setBody(strings.join('\n'));
			}
		})
		application.behavior.setTitle('checkout');
	} catch (e) {
		console.log(e.message)
		debugger
	}

    application.behavior.setTitle('complete');
    application.behavior.setBody('');
trace("MAIN - EXIT\n");
}

export default function() {
  trace(`Working directory: ${dir}\n`);

  doStuff();

  return new Application(null, {
    displayListLength: 25600,
    commandListLength: 2048,
    touchCount: 1,
    Behavior: ApplicationBehavior,
  })
}

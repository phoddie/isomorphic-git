/* global globalThis trace */

globalThis.console = class {
  static log(...msg) {
    trace(...msg, '\n')
  }
}

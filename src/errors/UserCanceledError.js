import { BaseError } from 'BaseError'

export class UserCanceledError extends BaseError {
  constructor() {
    super(`The operation was canceled.`)
    this.code = this.name = UserCanceledError.code
    this.data = {}
  }
}
/** @type {'UserCanceledError'} */
UserCanceledError.code = 'UserCanceledError'

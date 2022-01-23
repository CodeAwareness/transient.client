import type { ManagerOptions, SocketOptions } from 'socket.io-client'
import { io } from 'socket.io-client'

export type TTransientSocketOptions = ManagerOptions & SocketOptions

export type TLogger = {
  error: (...args: any[]) => void
  debug: (...args: any[]) => void
  log:   (...args: any[]) => void
  info:  (...args: any[]) => void
}

export type TTransientHandler = {
  url: string
  logger?:   TLogger // { log, debug, info } logger object (defaults to logger)
  onError?:  (err: any) => void // error handler
}

let logger: TLogger = console

/*
 * Exponential wait time for connection ready
 */
let serverURL: string
let wsocket: any
let _delay: number
const expDelay = () => {
  _delay = _delay * 2
  return _delay
}

const resetDelay = () => {
  _delay = 200
}

const socketOptions = {
  reconnectionDelayMax: 10000,
  forceNew: true,
  withCredentials: true,
  timestampRequests: true,
  auth: null as any,
}

const reconnect = (): any => {
  logger.log('Transient.client: reconnecting')
  // TODO: SECURITY: origin: [serverURL],
  wsocket = io(serverURL, socketOptions)
  return wsocket
}

const setToken = (token: string) => {
  socketOptions.auth = { token }
  reconnect()
}

/*
 * Transmit an action, and perhaps some data. Recommend a namespacing format for the action, something like `<domain>:<action>`, e.g. `auth:login` or `users:query`.
 * The response from Transient.server comes in the form of `res:<domain>:<action>` with the `domain` and `action` being the same as the transmitted ones.
 */
const transmit = (action: string, data?: any) => {
  return new Promise((resolve, reject) => {
    if (!wsocket) {
      logger.error(`Transient.client: no socket while trying to transmit ${action}`)
      return reject(new Error('no socket connection'))
    }
    resetDelay()
    const pendingConnection: any = () => {
      logger.info(`Transient.client: pending connection (delay: ${_delay})`)
      if (!wsocket.connected) {
        setTimeout(pendingConnection, expDelay())
        return
      }
      resetDelay()
      logger.info(`Transient.client: will emit action: ${action}`)
      wsocket.emit(action, data)
      wsocket.on(`res:${action}`, resolve)
      wsocket.on(`error:${action}`, reject)
    }

    pendingConnection()
  })
}

/*
 * initialize Transient client
 *
 * @param TTransientHandler - { url: the websocket server URL, onError: (optional) the error handler, logger: (optional) the logger object to use instead of console }
 *
 * @return Promise<Socket> - Once the socket is connected the returned Promise will resolve with the web socket object; will reject with an error if not connected within 5 seconds.
 *
 * TODO: work out a customizable reconnect mechanism
 */
const init = (options: TTransientHandler): Promise<void> => {
  const { url, onError } = options
  if (options.logger) logger = options.logger
  serverURL = url
  if (!wsocket) reconnect()

  return new Promise((resolve, reject) => {
    let connected: boolean
    setTimeout(() => {
      if (!connected) reject(new Error('Transient.client: could not connect for 5 seconds'))
    }, 5000)

    wsocket.on('connect', () => {
      logger.info(`Transient.client: websocket connected. Auth: ${wsocket.auth}`)
      connected = true
      resolve(wsocket)
    })

    wsocket.on('disconnect', (reason: any) => {
      logger.info('Transient.client: websocket disconnected, will try to reconnect', reason)
      return wsocket.reconnect()
    })

    wsocket.onAny((ev: any) => logger.info('Transient.client: newly received event', ev))
    wsocket.prependAny((ev: any) => logger.info('Transient.client: socket will emit', ev))

    if (onError) wsocket.on('error', onError)
  })
}

export const tcClient = {
  init,
  reconnect,
  setToken,
  socketOptions,
  transmit,
}

export default tcClient

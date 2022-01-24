import type { ManagerOptions, SocketOptions } from 'socket.io-client'
import { Manager } from 'socket.io-client'

export type TTransientSocketOptions = ManagerOptions & SocketOptions

export type TLogger = {
  error: (...args: any[]) => void
  debug: (...args: any[]) => void
  log:   (...args: any[]) => void
  info:  (...args: any[]) => void
}

export type TTransientHandler = {
  url: string // WS or WSS server URL
  ns?: string // websocket namespace
  options?: TTransientSocketOptions
  logger?:   TLogger // { log, debug, info } logger object (defaults to logger)
  onError?:  (err: any) => void // error handler
}

// TODO: Convert module to class, in order to enable multiple tcClients on the same app
let logger: TLogger = console

/*
 * Exponential wait time for connection ready
 */
let manager: any
let serverURL: string
let wsNamespace: string
let wsocket: any
let _delay: number
const expDelay = () => {
  _delay = _delay * 2
  return _delay
}

const resetDelay = () => {
  _delay = 200
}

let socketOptions = {
  reconnectionDelayMax: 10000,
  forceNew: true,
  withCredentials: true,
  timestampRequests: true,
  auth: null as any,
} as TTransientSocketOptions

// TODO: use reconnectionAttempts and reconnectionDelay to handle transience
// TODO: SECURITY: origin: [serverURL],
const reconnect = (): any => {
  logger.log('Transient.client: reconnecting')
  if (!manager) throw new Error('Transient.client cannot connect without initialization')

  wsocket = manager.socket(wsNamespace, socketOptions)
  manager.open(handleServerDown)

  function pendingConnection() {
    logger.info(`Transient.client: pending reconnect (delay: ${_delay})`)
    if (!wsocket.connected) {
      setTimeout(pendingConnection, expDelay())
      return
    }
    resetDelay()
    logger.info('Transient.client: connected')
  }

  function handleServerDown(err: Error | undefined) {
    logger.info('Transient.client manager returned', err)
    if (err) {
      // server down, we'll try again
      pendingConnection()
    } else {
      logger.info('Transient.client: connected')
      resetDelay()
    }
  }
}

const setToken = (token: string) => {
  socketOptions.auth = { token }
  reconnect()
}

/*
 * Transmit an action, and perhaps some data. Recommend a namespacing format for the action, something like `<domain>:<action>`, e.g. `auth:login` or `users:query`.
 * The response from Transient.server comes in the form of `res:<domain>:<action>` with the `domain` and `action` being the same as the transmitted ones.
 *
 * TODO: prevent multiple transmit requests to overload the system with pendingConnection (consider reconnect fn too)
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
 * Connect Transient client
 *
 * @param TTransientHandler - { url: the websocket server URL, onError: (optional) the error handler, logger: (optional) the logger object to use instead of console }
 *
 * @return Promise<Socket> - Once the socket is connected the returned Promise will resolve with the web socket object; will reject with an error if not connected within 5 seconds.
 *
 * TODO: work out a customizable reconnect mechanism
 */
const connect = (config: TTransientHandler): Promise<void> => {
  const { url, ns, onError } = config
  if (config.logger) logger = config.logger
  if (config.options) socketOptions = config.options
  serverURL = url
  wsNamespace = ns || '/'
  manager = new Manager(serverURL, socketOptions)
  logger.info(`Transient.client initializing with ${url}/${wsNamespace}`, socketOptions)
  if (!wsocket) reconnect()

  return new Promise((resolve, reject) => {
    let connected: boolean
    setTimeout(() => {
      if (!connected) logger.log('Transient.client: could not connect for 10 seconds.')
    }, 10000)

    wsocket.on('connect', () => {
      logger.info(`Transient.client: websocket connected. Auth: ${wsocket.auth}`)
      connected = true
      resolve(wsocket)
    })

    wsocket.on('disconnect', (reason: any) => {
      logger.info('Transient.client: websocket disconnected', reason)
    })

    wsocket.onAny((ev: any) => logger.info('Transient.client: newly received event', ev))
    wsocket.prependAny((ev: any) => logger.info('Transient.client: socket will emit', ev))

    if (onError) wsocket.on('error', onError)
  })
}

export const tcClient = {
  connect,
  manager,
  reconnect,
  setToken,
  socketOptions,
  transmit,
  wsocket,
}

export default tcClient

import ipc from 'node-ipc'

let ipcServer
let dataCallback
let connectCallback

export function config(id: string, server: string, retry = 1500) {
  ipc.config.id = id
  ipc.config.retry = retry
  ipcServer = server

  ipc.connectTo(ipcServer, function() {
    ipc.of[ipcServer].on('connect', doConnect)
    ipc.of[ipcServer].on('disconnect', doDisconnect)
    ipc.of[ipcServer].on('message', processMessage)
  })
}

export function sendMessage(data: any) {
  ipc.of[ipcServer].emit('message', data)
}

function doConnect() {
  ipc.log(`connected to ${ipcServer}`, ipc.config)
  if (connectCallback) connectCallback(ipc.config)
}

function doDisconnect() {
  ipc.log('client has disconnected')
}

function processMessage(data: any) {
  ipc.log('got a message', data)
  if (dataCallback) dataCallback(data)
}

function onConnect(cb: any) {
  connectCallback = cb
}

function onMessage(cb: any) {
  dataCallback = cb
}

export default {
  config,
  onConnect,
  onMessage,
  sendMessage,
}

const messages = require('./rpc-messages')
const HRPC = require('hrpc-runtime')
const RPC = require('hrpc-runtime/rpc')

const errorEncoding = {
  encode: messages.RPCError.encode,
  encodingLength: messages.RPCError.encodingLength,
  decode (buf, offset) {
    const { message, code, errno, details } = messages.RPCError.decode(buf, offset)
    errorEncoding.decode.bytes = messages.RPCError.decode.bytes
    const err = new Error(message)
    err.code = code
    err.errno = errno
    err.details = details
    return err
  }
}

class HRPCServiceDrive {
  constructor (rpc) {
    const service = rpc.defineService({ id: 1 })

    this._mountDrive = service.defineMethod({
      id: 1,
      requestEncoding: messages.DriveRequest,
      responseEncoding: messages.DriveKey
    })

    this._saveIncMailMsg = service.defineMethod({
      id: 2,
      requestEncoding: messages.Email,
      responseEncoding: messages.FileResponse
    })

    this._unlinkMailMsg = service.defineMethod({
      id: 3,
      requestEncoding: messages.FileRequest,
      responseEncoding: messages.Empty
    })

    this._addPeer = service.defineMethod({
      id: 4,
      requestEncoding: messages.PeerRequest,
      responseEncoding: messages.Empty
    })

    this._removePeer = service.defineMethod({
      id: 5,
      requestEncoding: messages.PeerRequest,
      responseEncoding: messages.Empty
    })

    this._destroyDrive = service.defineMethod({
      id: 6,
      requestEncoding: messages.DriveKey,
      responseEncoding: messages.Empty
    })

    this._closeDrive = service.defineMethod({
      id: 7,
      requestEncoding: messages.DriveKey,
      responseEncoding: messages.Empty
    })
  }

  onRequest (context, handlers = context) {
    if (handlers.mountDrive) this._mountDrive.onrequest = handlers.mountDrive.bind(context)
    if (handlers.saveIncMailMsg) this._saveIncMailMsg.onrequest = handlers.saveIncMailMsg.bind(context)
    if (handlers.unlinkMailMsg) this._unlinkMailMsg.onrequest = handlers.unlinkMailMsg.bind(context)
    if (handlers.addPeer) this._addPeer.onrequest = handlers.addPeer.bind(context)
    if (handlers.removePeer) this._removePeer.onrequest = handlers.removePeer.bind(context)
    if (handlers.destroyDrive) this._destroyDrive.onrequest = handlers.destroyDrive.bind(context)
    if (handlers.closeDrive) this._closeDrive.onrequest = handlers.closeDrive.bind(context)
  }

  mountDrive (data) {
    return this._mountDrive.request(data)
  }

  mountDriveNoReply (data) {
    return this._mountDrive.requestNoReply(data)
  }

  saveIncMailMsg (data) {
    return this._saveIncMailMsg.request(data)
  }

  saveIncMailMsgNoReply (data) {
    return this._saveIncMailMsg.requestNoReply(data)
  }

  unlinkMailMsg (data) {
    return this._unlinkMailMsg.request(data)
  }

  unlinkMailMsgNoReply (data) {
    return this._unlinkMailMsg.requestNoReply(data)
  }

  addPeer (data) {
    return this._addPeer.request(data)
  }

  addPeerNoReply (data) {
    return this._addPeer.requestNoReply(data)
  }

  removePeer (data) {
    return this._removePeer.request(data)
  }

  removePeerNoReply (data) {
    return this._removePeer.requestNoReply(data)
  }

  destroyDrive (data) {
    return this._destroyDrive.request(data)
  }

  destroyDriveNoReply (data) {
    return this._destroyDrive.requestNoReply(data)
  }

  closeDrive (data) {
    return this._closeDrive.request(data)
  }

  closeDriveNoReply (data) {
    return this._closeDrive.requestNoReply(data)
  }
}

module.exports = class HRPCSession extends HRPC {
  constructor (rawSocket, { maxSize = 2 * 1024 * 1024 * 1024 } = {}) {
    super()

    this.rawSocket = rawSocket
    this.rawSocketError = null
    rawSocket.on('error', (err) => {
      this.rawSocketError = err
    })

    const rpc = new RPC({ errorEncoding, maxSize })
    rpc.pipe(this.rawSocket).pipe(rpc)
    rpc.on('close', () => this.emit('close'))
    rpc.on('error', (err) => {
      if ((err !== this.rawSocketError && !isStreamError(err)) || this.listenerCount('error')) this.emit('error', err)
    })

    this.drive = new HRPCServiceDrive(rpc)
  }

  destroy (err) {
    this.rawSocket.destroy(err)
  }
}

function isStreamError (err) {
  return err.message === 'Writable stream closed prematurely' || err.message === 'Readable stream closed prematurely'
}

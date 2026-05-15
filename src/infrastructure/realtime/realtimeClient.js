import { runtimeConfig } from '../../config'
import { REALTIME_CONNECTION_STATUSES } from './realtimeEvents'

const DEFAULT_RECONNECT_DELAY_MS = 3000

export class WebsocketClient {
  constructor({ reconnectDelayMs = DEFAULT_RECONNECT_DELAY_MS, url = runtimeConfig.realtimeUrl } = {}) {
    this.listeners = new Set()
    this.reconnectDelayMs = reconnectDelayMs
    this.reconnectTimerId = 0
    this.shouldReconnect = false
    this.socket = null
    this.status = REALTIME_CONNECTION_STATUSES.CLOSED
    this.statusListeners = new Set()
    this.token = null
    this.url = url
  }

  connect({ token } = {}) {
    if (!this.url || this.socket) {
      return
    }

    this.token = token || this.token
    this.shouldReconnect = true
    this.setStatus(REALTIME_CONNECTION_STATUSES.CONNECTING)
    this.socket = new WebSocket(getRealtimeUrl(this.url, this.token))
    this.socket.addEventListener('open', () => this.setStatus(REALTIME_CONNECTION_STATUSES.OPEN))
    this.socket.addEventListener('message', (event) => this.handleMessage(event))
    this.socket.addEventListener('close', () => this.handleClose())
    this.socket.addEventListener('error', () => this.setStatus(REALTIME_CONNECTION_STATUSES.RECONNECTING))
  }

  disconnect() {
    this.shouldReconnect = false
    this.token = null
    window.clearTimeout(this.reconnectTimerId)
    this.socket?.close()
    this.socket = null
    this.setStatus(REALTIME_CONNECTION_STATUSES.CLOSED)
  }

  send(type, payload = {}) {
    if (this.socket?.readyState !== WebSocket.OPEN) {
      return false
    }

    this.socket.send(JSON.stringify({ payload, type }))
    return true
  }

  subscribe(listener) {
    this.listeners.add(listener)

    return () => this.listeners.delete(listener)
  }

  subscribeToStatus(listener) {
    this.statusListeners.add(listener)
    listener(this.status)

    return () => this.statusListeners.delete(listener)
  }

  handleMessage(messageEvent) {
    const event = parseRealtimeEvent(messageEvent.data)

    if (event) {
      this.listeners.forEach((listener) => listener(event))
    }
  }

  handleClose() {
    this.socket = null

    if (!this.shouldReconnect) {
      this.setStatus(REALTIME_CONNECTION_STATUSES.CLOSED)
      return
    }

    this.setStatus(REALTIME_CONNECTION_STATUSES.RECONNECTING)
    this.reconnectTimerId = window.setTimeout(() => this.connect({ token: this.token }), this.reconnectDelayMs)
  }

  setStatus(status) {
    this.status = status
    this.statusListeners.forEach((listener) => listener(status))
  }
}

export const websocketClient = new WebsocketClient()

function getRealtimeUrl(url, token) {
  if (!token) {
    return url
  }

  const nextUrl = new URL(url)
  nextUrl.searchParams.set('token', token)

  return nextUrl.toString()
}

function parseRealtimeEvent(data) {
  try {
    const event = JSON.parse(data)
    return typeof event?.type === 'string' ? event : null
  } catch {
    return null
  }
}

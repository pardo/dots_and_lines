import EventTarget from './simple-events'
import { joinRoom } from 'trystero/nostr'

// Trystero groups peers by (appId, room). Peers that call joinRoom with the
// same match name land in the same room and connect over WebRTC; signaling is
// handled through public relays, so there is no server/config to run.
const APP_ID = 'dots_and_lines_pardo'

// A curated set of open Nostr relays used for WebRTC signaling. Pinning these
// avoids the auth-gated / whitelisted relays in Trystero's default list, which
// otherwise log noisy connection failures.
const RELAY_URLS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.primal.net',
  'wss://nostr.mom',
  'wss://relay.nostr.band'
]

function Networking () {
  /*
   simple 1 on 1 peer connection over Trystero
   events that fire
    .on("pre-connection")
    .on("connected")
    .on("error")
    .on("network_${event.type}")
   net = Networking()
   net.hostMatch("room-name")
   net.on("connected", function () { })
   net.sendEvent("player_died", "data")
   net.on("network_player_died", function (data) { })
  */

  this.initialize = function () {
    this.hosting = false
    this.joining = false
    this.waitingConnection = false
    this.matchName = null
    this.room = null
    this.sendMessage = null
    this.events = new EventTarget()
  }

  this.on = function (type, callback) {
    this.events.on(type, callback)
  }

  this.disconnect = function () {
    // reset networking state and leave the room
    this.hosting = false
    this.joining = false
    this.waitingConnection = false
    if (this.room) {
      try { this.room.leave() } catch (e) { /* already gone */ }
    }
    this.room = null
    this.sendMessage = null
  }

  this.sendEvent = function (type, data) {
    if (!this.sendMessage) { return }
    this.sendMessage({ type, data })
  }

  this.handlePeerData = function (payload) {
    // payload is { type, data } as sent by the other peer
    this.events.fire(`network_${payload.type}`, payload.data)
  }

  this.connectRoom = function (name) {
    this.matchName = name
    this.room = joinRoom({ appId: APP_ID, relayUrls: RELAY_URLS }, name)

    // a single named action carries every game message
    const [send, receive] = this.room.makeAction('msg')
    this.sendMessage = send
    receive((payload) => {
      this.handlePeerData(payload)
    })

    this.room.onPeerJoin(() => {
      this.waitingConnection = false
      this.events.fire('connected')
    })
    this.room.onPeerLeave(() => {
      // reset state before notifying so listeners see the offline state
      this.disconnect()
      this.events.fire('error')
    })
  }

  this.hostMatch = function (name) {
    this.matchName = name
    this.waitingConnection = true
    this.hosting = true
    this.events.fire('pre-connection')
    this.connectRoom(name)
  }

  this.joinMatch = function (name) {
    this.matchName = name
    this.waitingConnection = true
    this.joining = true
    this.events.fire('pre-connection')
    this.connectRoom(name)
  }
  return this
}

export default Networking

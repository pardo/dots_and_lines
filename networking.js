import EventTarget from './simple-events'
import * as firebase from 'firebase/app'
import Peer from 'simple-peer'
import 'firebase/database'

const config = JSON.parse(window.atob([
  'eyJhcGlLZXkiOiJBSXphU3lDeVgtcTFFNH',
  'l4OTl4X1kyR0V5T0xQby1HbG5fVm9tcUki',
  'LCJhdXRoRG9tYWluIjoic29kb2t1LXBhcm',
  'RvLmZpcmViYXNlYXBwLmNvbSIsImRhdGFi',
  'YXNlVVJMIjoiaHR0cHM6Ly9zb2Rva3UtcG',
  'FyZG8uZmlyZWJhc2Vpby5jb20iLCJwcm9q',
  'ZWN0SWQiOiJzb2Rva3UtcGFyZG8iLCJzdG',
  '9yYWdlQnVja2V0Ijoic29kb2t1LXBhcmRv',
  'LmFwcHNwb3QuY29tIiwibWVzc2FnaW5nU2',
  'VuZGVySWQiOiIxMDE1NDIyNDAzMzUzIn0'
].join('')))

firebase.initializeApp(config)
const firebaseDatabase = firebase.database()

function Networking () {
  /*
   simple 1 on 1 peer connection
   events that fires
    .on("pre-connection")
    .on("connected")
    .on("error")
    .on("network_${event.type}")
   net = Networking()
   net.hotsMatch()
   net.events.on("connected", function () { })
   net.sendEvent("player_died", "data")
   net.events.on("network_player_died", "data")
  */

  this.initialize = function () {
    this.hosting = false
    this.joining = false
    this.waitingConnection = false
    this.matchName = null
    this.peerOfferSent = false
    this.peerAnswerSent = false
    this.events = new EventTarget()
  }

  this.on = function (type, callback) {
    this.events.on(type, callback)
  }

  this.connectionError = function () {
    // reset networking state
    this.hosting = false
    this.joining = false
    this.waitingConnection = false
    this.peerOfferSent = false
    this.peerAnswerSent = false
  }

  this.sendEvent = function (type, data) {
    this.peer.send(JSON.stringify({ type, data }))
  }

  this.handlePeerData = function (data) {
    data = JSON.parse(data)
    console.log(data)
    this.events.fire(`network_${data.type}`, data.data)
  }

  this.connectedToServer = function () {
    // connected to server
    this.waitingConnection = false
    this.events.fire('connected')
  }

  this.connectFirebaseDatabase = function (name) {
    this.databaseRef = firebaseDatabase.ref('dots-' + name)
    this.databaseRef.on('value', snapshot => {
      this.handleFirebaseUpdate(snapshot)
    })
  }

  this.handleFirebaseUpdate = function (snapshot) {
    // firebase is used to share the signaling from peer
    if (snapshot.val() === '') { return }
    const data = JSON.parse(snapshot.val())
    // the host ignores the peer offer
    if (data.type === 'offer' && this.hosting) { return }
    // the client ignores the peer answer
    if (data.type === 'answer' && this.joining) { return }
    // skip sending the offer / answer again
    if (this.peerOfferSent && data.type === 'offer') { return }
    if (this.peerAnswerSent && data.type === 'answer') { return }

    this.peerOfferSent = data.type === 'offer'
    this.peerAnswerSent = data.type === 'answer'
    // send the signal to connect
    this.peer.signal(data)
  }

  this.attachPeerEvents = function (peer) {
    peer.on('error', (err) => {
      this.events.fire('error', err)
      this.connectionError()
    })
    peer.on('signal', data => {
      // set signaling value in firebase
      this.databaseRef.set(JSON.stringify(data))
    })
    this.peer.on('connect', () => {
      this.databaseRef.set('')
      this.connectedToServer()
    })
    this.peer.on('data', (data) => {
      this.handlePeerData(data)
    })
  }

  this.hotsMatch = function (name) {
    this.waitingConnection = true
    this.hosting = true
    this.matchName = name
    this.events.fire('pre-connection')
    if (this.databaseRef) { this.databaseRef.off('value') }
    this.connectFirebaseDatabase(this.matchName)
    this.databaseRef.set('')
    this.peer = new Peer({ initiator: true, trickle: false })
    this.attachPeerEvents(this.peer)
  }

  this.joinMatch = function (name) {
    this.waitingConnection = true
    this.joining = true
    this.matchName = name
    this.events.fire('pre-connection')
    if (this.databaseRef) { this.databaseRef.off('value') }
    this.connectFirebaseDatabase(this.matchName)
    this.peer = new Peer({ initiator: false, trickle: false })
    this.attachPeerEvents(this.peer)
    // client will read the value already present in the store
    this.databaseRef.ref.once('value').then(snapshot => {
      this.handleFirebaseUpdate(snapshot)
    })
  }
  return this
}

export default Networking

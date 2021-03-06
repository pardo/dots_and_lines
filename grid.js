import './grid.square.css'
import Networking from './networking.js'

const BLUE = 'b'
const RED = 'r'

function GridGame () {
  this.initialize = function (container) {
    this.container = container
    this.size = {
      width: 6,
      height: 6
    }

    this.serializedHistory = []
    // could be either blue or red
    this.currentPlayer = BLUE
    this.points = {}
    this.points[BLUE] = 0
    this.points[RED] = 0

    // every time a line is made we store a true value here
    // line information will be a double point key
    // x0-y0-x1-y1 where 0 is the top left point and 1 is the bottom right
    // and example could be
    // '0-0-0-1': false
    // '0-0-0-1': BLUE
    // '0-0-0-1': RED
    // '0-0-1-1' not valid it is a diagonal
    // '0-0-1-0: valid
    this.connectedPoints = {}
    // data will be like { 'x-y': BLUE, 'x-y': RED, 'x-y': false }
    this.completedBlocks = {}
    this.currentPlayerElement = null
    this.otherPlayerElement = null
    // networking
    this.matchPlayer = BLUE // server blue | client red
    this.networking = new Networking()
    this.networking.initialize()
    this.attachNetworkingEvents()

    this.attachUIEvents()
    this.createDom()
    this.pushToHistory()
  }

  this.attachUIEvents = function () {
    window.document.querySelector('#reset').addEventListener('click', (e) => {
      this.resetGame()
    })
    window.document.querySelector('#join').addEventListener('click', (e) => {
      e.preventDefault()
      this.joinMatch()
    })
    window.document.querySelector('#host').addEventListener('click', (e) => {
      e.preventDefault()
      this.hotsMatch()
    })
  }

  this.checkEnd = function () {
    const current = this.points[RED] + this.points[BLUE]
    const total = this.size.width * this.size.height
    if (current !== total) {
      return
    }

    if (this.points[RED] > this.points[BLUE]) {
      window.alert('Red Player Won')
    } else if (this.points[RED] < this.points[BLUE]) {
      window.alert('Blue Player Won')
    } else {
      window.alert('No winners')
    }
  }

  this.isSquareComplete = function (x, y) {
    // if all the lines of the current block are marked then is complete
    const tl = `${x}-${y}`
    const tr = `${x + 1}-${y}`
    const bl = `${x}-${y + 1}`
    const br = `${x + 1}-${y + 1}`
    return this.connectedPoints[`${tl}-${tr}`] && this.connectedPoints[`${tl}-${bl}`] && this.connectedPoints[`${bl}-${br}`] && this.connectedPoints[`${tr}-${br}`]
  }

  this.checkAndMark = function (x, y, currentPlayer) {
    // return true if the block is now completed and marked by the current player
    let markedBlock = false
    if (!this.completedBlocks[`${x}-${y}`] && this.isSquareComplete(x, y)) {
      markedBlock = true
      this.completedBlocks[`${x}-${y}`] = currentPlayer
      this.markBlockAsActive(x, y, currentPlayer)
    }
    return markedBlock
  }

  this.connectPoints = function (x0, y0, x1, y1, currentPlayer) {
    const origin = `${x0}-${y0}`
    const destination = `${x1}-${y1}`
    if (this.connectedPoints[`${origin}-${destination}`]) {
      // already taken
      return false
    }
    this.markLineAsActive(x0, y0, x1, y1, currentPlayer)
    this.connectedPoints[`${origin}-${destination}`] = currentPlayer
    let marked = 0
    marked += this.checkAndMark(x0, y0, currentPlayer) ? 1 : 0
    marked += this.checkAndMark(x0 - 1, y0, currentPlayer) ? 1 : 0
    marked += this.checkAndMark(x0, y0 - 1, currentPlayer) ? 1 : 0
    if (marked > 0) {
      this.points[this.currentPlayer] += marked
      this.updateCurrentPlayer(this.currentPlayer)
      this.checkEnd()
    } else {
      this.switchCurrentPlayer(this.currentPlayer)
    }
    return true
  }

  this.pushToHistory = function () {
    this.serializedHistory.push(JSON.stringify(this.serialize()))
  }

  this.popFromHistory = function () {
    var history = this.serializedHistory.pop()
    if (history === undefined) { return }
    this.unserialize(JSON.parse(history))
    this.sendUpdate()
  }

  this.onClickLineServer = function (x0, y0, x1, y1) {
    this.pushToHistory()
    if (!this.connectPoints(x0, y0, x1, y1, this.currentPlayer)) {
      this.serializedHistory.pop()
    }
    this.sendUpdate()
  }

  this.onClickLineDom = function (x0, y0, x1, y1) {
    if (this.shouldPreventClick()) { return }
    if (this.networking.joining) {
      // if we are the client send clicks to server
      return this.sendClick(x0, y0, x1, y1)
    }
    this.pushToHistory()
    if (!this.connectPoints(x0, y0, x1, y1, this.currentPlayer)) {
      this.serializedHistory.pop()
    }
    this.sendUpdate()
  }

  this.switchCurrentPlayer = function (currentPlayer) {
    this.currentPlayer = currentPlayer === BLUE ? RED : BLUE
    this.updateCurrentPlayer(this.currentPlayer)
  }

  // DOM RELATED
  this.markBlockAsActive = function (x, y, currentPlayer) {
    this.markBlockAs(x, y, true, currentPlayer)
  }

  this.updateHeaderState = function () {
    const hostBTN = document.querySelector('#host')
    const joinBTN = document.querySelector('#join')
    const resetBTN = document.querySelector('#reset')
    const connectionStatusLabel = document.querySelector('#connectionStatus')
    joinBTN.classList.remove('lock', 'hide')
    hostBTN.classList.remove('lock', 'hide')
    resetBTN.classList.remove('lock', 'hide')
    connectionStatusLabel.innerText = ''
    if (this.networking.waitingConnection) {
      connectionStatusLabel.innerText = 'Waiting Connection'
    }
    if (this.networking.hosting) {
      hostBTN.classList.add('lock')
      joinBTN.classList.add('hide')
    }
    if (this.networking.joining) {
      joinBTN.classList.add('lock')
      hostBTN.classList.add('hide')
      resetBTN.classList.add('hide')
    }
  }
  this.setBackgroundPlayer = function () {
    // add greenish background color if our turn
    // check if online first
    if (!this.isOnlineMatch()) { return }
    const element = document.querySelector('body')
    if (this.matchPlayer === this.currentPlayer) {
      element.classList.add('your-turn')
    } else {
      element.classList.remove('your-turn')
    }
  }

  this.markBlockAs = function (x, y, isActive, currentPlayer) {
    const element = document.getElementById(`block-${x}-${y}`)
    if (!element) { return }
    element.classList.remove('active')
    element.classList.remove(BLUE)
    element.classList.remove(RED)
    if (isActive) {
      element.classList.add('active')
    }
    if (currentPlayer) {
      element.classList.add(currentPlayer)
    }
  }

  this.markLineAsActive = function (x0, y0, x1, y1, currentPlayer) {
    this.markLineAs(x0, y0, x1, y1, true, currentPlayer)
  }

  this.markLineAs = function (x0, y0, x1, y1, isActive, currentPlayer) {
    const element = document.getElementById(`line-${x0}-${y0}-${x1}-${y1}`)
    if (!element) { return }
    element.classList.remove('active')
    element.classList.remove(BLUE)
    element.classList.remove(RED)
    if (isActive) {
      element.classList.add('active')
    }
    if (currentPlayer) {
      element.classList.add(currentPlayer)
    }
  }

  this.createDotElement = function (parent) {
    const element = document.createElement('div')
    element.className = 'dot'
    parent.appendChild(element)
    return element
  }

  this.createLineElement = function (parent, isVertical, x, y) {
    const element = document.createElement('div')
    element.className = isVertical ? 'v-line line' : 'h-line line'
    var origin = [x, y]
    var destination = isVertical ? [x, y + 1] : [x + 1, y]
    element.id = `line-${origin[0]}-${origin[1]}-${destination[0]}-${destination[1]}`
    element.addEventListener('click', (e) => {
      this.onClickLineDom(origin[0], origin[1], destination[0], destination[1], this.currentPlayer)
    })
    parent.appendChild(element)
    return element
  }

  this.createHorizontalLineElement = function (parent, x, y) {
    return this.createLineElement(parent, false, x, y)
  }

  this.createVerticalLineElement = function (parent, x, y) {
    return this.createLineElement(parent, true, x, y)
  }

  this.createBlockElement = function (parent, x, y) {
    const element = document.createElement('div')
    element.className = 'block'
    element.id = `block-${x}-${y}`
    parent.appendChild(element)
    return element
  }

  this.createRowElement = function (parent) {
    const element = document.createElement('div')
    element.className = 'row'
    parent.appendChild(element)
    return element
  }

  this.createRowDotLine = function (container, y) {
    var row = this.createRowElement(container)
    for (let x = 0; x < this.size.width; x++) {
      this.createDotElement(row, x, y)
      this.createHorizontalLineElement(row, x, y)
    }
    this.createDotElement(row, this.size.width, y)
  }

  this.createLineBlockRow = function (container, y) {
    var row = this.createRowElement(container)
    for (let x = 0; x < this.size.width; x++) {
      this.createVerticalLineElement(row, x, y)
      this.createBlockElement(row, x, y)
    }
    this.createVerticalLineElement(row, this.size.width, y)
  }

  this.createCurrentPlayerLabel = function (container) {
    let row = this.createRowElement(container)
    let element = document.createElement('div')
    element.className = 'current-player'
    row.appendChild(element)
    this.currentPlayerElement = element

    row = this.createRowElement(container)
    element = document.createElement('div')
    element.className = 'other-player'
    row.appendChild(element)
    this.otherPlayerElement = element
  }

  this.updateCurrentPlayer = function (currentPlayer) {
    this.container.classList.remove(RED)
    this.container.classList.remove(BLUE)
    this.currentPlayerElement.classList.remove(RED)
    this.currentPlayerElement.classList.remove(BLUE)
    this.otherPlayerElement.classList.remove(RED)
    this.otherPlayerElement.classList.remove(BLUE)

    if (currentPlayer === BLUE) {
      this.container.classList.add(BLUE)
      this.currentPlayerElement.classList.add(BLUE)
      this.currentPlayerElement.innerText = `Blue: ${this.points[BLUE]}`
      this.otherPlayerElement.classList.add(RED)
      this.otherPlayerElement.innerText = `Red: ${this.points[RED]}`
    } else {
      this.container.classList.add(RED)
      this.currentPlayerElement.classList.add(RED)
      this.currentPlayerElement.innerText = `Red: ${this.points[RED]}`
      this.otherPlayerElement.classList.add(BLUE)
      this.otherPlayerElement.innerText = `Blue: ${this.points[BLUE]}`
    }
    this.setBackgroundPlayer()
  }

  this.createDom = function () {
    for (let y = 0; y < this.size.height; y++) {
      this.createRowDotLine(this.container, y)
      this.createLineBlockRow(this.container, y)
    }
    this.createRowDotLine(this.container, this.size.height)
    this.createCurrentPlayerLabel(this.container)
    this.switchCurrentPlayer(this.currentPlayer)
  }

  this.resetGame = function () {
    const points = {}
    points[BLUE] = 0
    points[RED] = 0
    this.unserialize({
      currentPlayer: BLUE,
      connectedPoints: {},
      completedBlocks: {},
      points: points
    })
    this.sendUpdate()
  }

  this.serialize = function () {
    return {
      currentPlayer: this.currentPlayer,
      connectedPoints: this.connectedPoints,
      completedBlocks: this.completedBlocks,
      points: this.points
    }
  }

  this.unserialize = function (data) {
    this.currentPlayer = data.currentPlayer
    this.connectedPoints = data.connectedPoints
    this.completedBlocks = data.completedBlocks
    this.points = data.points
    for (let y = 0; y <= this.size.height; y++) {
      for (let x = 0; x <= this.size.width; x++) {
        // blocks
        if (this.completedBlocks[`${x}-${y}`]) {
          this.markBlockAs(x, y, true, this.completedBlocks[`${x}-${y}`])
        } else {
          this.markBlockAs(x, y)
        }
        // lines left to right
        let line = this.connectedPoints[`${x}-${y}-${x + 1}-${y}`]
        if (line) {
          this.markLineAsActive(x, y, x + 1, y, line)
        } else {
          this.markLineAs(x, y, x + 1, y)
        }
        // lines top to bottom
        line = this.connectedPoints[`${x}-${y}-${x}-${y + 1}`]
        if (line) {
          this.markLineAsActive(x, y, x, y + 1, line)
        } else {
          this.markLineAs(x, y, x, y + 1)
        }
      }
    }
    this.updateCurrentPlayer(this.currentPlayer)
    this.checkEnd()
  }

  this.save = function () {
    window.localStorage.setItem('data', JSON.stringify(this.serialize()))
  }

  this.load = function () {
    this.unserialize(JSON.parse(window.localStorage.getItem('data')))
  }

  // networking guards
  this.shouldPreventClick = function () {
    if (this.networking.waitingConnection) { return true }
    if (this.networking.hosting || this.networking.joining) {
      return this.currentPlayer !== this.matchPlayer
    }
    return false
  }
  this.isOnlineMatch = function () {
    return this.networking.hosting || this.networking.joining
  }

  // networking events

  this.sendReset = function () {
    if (!this.networking.hosting) { return }
    this.networking.sendEvent('reset')
  }

  this.sendClick = function (x0, y0, x1, y1) {
    this.networking.sendEvent(
      'click',
      {
        x0: x0,
        y0: y0,
        x1: x1,
        y1: y1
      })
  }

  this.sendUpdate = function () {
    if (!this.networking.hosting) { return }
    if (this.networking.waitingConnection) { return }
    this.networking.sendEvent('update', this.serialize())
  }

  this.attachNetworkingEvents = function () {
    this.networking.on('network_reset', (data) => {
      this.resetGame()
    })

    this.networking.on('network_update', (data) => {
      this.unserialize(data)
    })

    this.networking.on('network_click', (data) => {
      if (this.currentPlayer === this.matchPlayer) {
        // the client cannot click if the server
        // is the current player
        return
      }
      this.onClickLineServer(data.x0, data.y0, data.x1, data.y1)
    })

    this.networking.on('pre-connection', () => {
      this.updateHeaderState()
    })

    this.networking.on('connected', () => {
      this.resetGame()
      this.updateHeaderState()
    })

    this.networking.on('error', () => {
      window.alert('Connection problems')
      this.updateHeaderState()
    })
  }

  this.hotsMatch = function () {
    this.matchPlayer = BLUE
    this.networking.hotsMatch(
      window.prompt('Put a name to the match')
    )
  }

  this.joinMatch = function () {
    this.matchPlayer = RED
    this.networking.joinMatch(
      window.prompt('I need the name of the match')
    )
  }
}

const game = new GridGame()

window.addEventListener('load', function () {
  var container = document.getElementById('grid-game')
  game.initialize(container)
})

window.addEventListener('keydown', (e) => {
  switch (e.which) {
    case 85:
      // u UNDO
      game.popFromHistory()
      break
    default:
      console.log(e.which)
  }
})

export default () => {}

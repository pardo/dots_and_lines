import './grid.css'

function GridGame () {
  this.initialize = function (container) {
    this.container = container
    this.size = {
      width: 6,
      height: 6
    }

    this.serializedHistory = []
    // could be either blue or red
    this.currentPlayer = 'blue'
    this.points = {
      'blue': 0,
      'red': 0
    }
    // every time a line is made we store a true value here
    // line information will be a double point key
    // x0-y0-x1-y1 where 0 is the top left point and 1 is the bottom right
    // and example could be
    // '0-0-0-1': false
    // '0-0-0-1': 'blue'
    // '0-0-0-1': 'red'
    // '0-0-1-1' not valid it is a diagonal
    // '0-0-1-0: valid
    this.connectedPoints = {}
    // data will be like { 'x-y': 'blue', 'x-y': 'red', 'x-y': false }
    this.completedBlocks = {}
    this.currentPlayerElement = null
    this.otherPlayerElement = null
    this.createDom()
    this.pushToHistory()
  }

  this.checkEnd = function () {
    let current = this.points['red'] + this.points['blue']
    let total = this.size.width * this.size.height
    if (current === total) {
      if (this.points['red'] > this.points['blue']) {
        window.alert('Red Player Won')
      } else if (this.points['red'] < this.points['blue']) {
        window.alert('Blue Player Won')
      } else {
        window.alert('No winners')
      }
    }
  }

  this.isSquareComplete = function (x, y) {
    // if all the lines of the current block are marked then is complete
    let tl = `${x}-${y}`
    let tr = `${x + 1}-${y}`
    let bl = `${x}-${y + 1}`
    let br = `${x + 1}-${y + 1}`
    return this.connectedPoints[`${tl}-${tr}`] && this.connectedPoints[`${tl}-${bl}`] && this.connectedPoints[`${bl}-${br}`] && this.connectedPoints[`${tr}-${br}`]
  }

  this.checkAndMark = function (x, y, currentPlayer) {
    // return true if the block is now complete and marked by the current player
    let markedBlock = false
    if (!this.completedBlocks[`${x}-${y}`] && this.isSquareComplete(x, y)) {
      markedBlock = true
      this.completedBlocks[`${x}-${y}`] = currentPlayer
      this.markBlockAsActive(x, y, currentPlayer)
    }
    return markedBlock
  }

  this.connectPoints = function (x0, y0, x1, y1, currentPlayer) {
    let origin = `${x0}-${y0}`
    let destination = `${x1}-${y1}`
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
  }

  this.onClickLine = function (x0, y0, x1, y1) {
    this.pushToHistory()
    if (!this.connectPoints(x0, y0, x1, y1, this.currentPlayer)) {
      this.serializedHistory.pop()
    }
  }

  this.switchCurrentPlayer = function (currentPlayer) {
    this.currentPlayer = currentPlayer === 'blue' ? 'red' : 'blue'
    this.updateCurrentPlayer(this.currentPlayer)
  }

  // DOM RELATED
  this.markBlockAsActive = function (x, y, currentPlayer) {
    this.markBlockAs(x, y, true, currentPlayer)
  }

  this.markBlockAs = function (x, y, isActive, currentPlayer) {
    let element = document.getElementById(`block-${x}-${y}`)
    if (!element) { return }
    element.classList.remove('active')
    element.classList.remove('blue')
    element.classList.remove('red')
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
    let element = document.getElementById(`line-${x0}-${y0}-${x1}-${y1}`)
    if (!element) { return }
    element.classList.remove('active')
    element.classList.remove('blue')
    element.classList.remove('red')
    if (isActive) {
      element.classList.add('active')
    }
    if (currentPlayer) {
      element.classList.add(currentPlayer)
    }
  }

  this.createDotElement = function (parent) {
    let element = document.createElement('div')
    element.className = 'dot'
    parent.appendChild(element)
    return element
  }

  this.createLineElement = function (parent, isVertical, x, y) {
    let element = document.createElement('div')
    element.className = isVertical ? 'v-line line' : 'h-line line'
    var origin = [x, y]
    var destination = isVertical ? [x, y + 1] : [x + 1, y]
    element.id = `line-${origin[0]}-${origin[1]}-${destination[0]}-${destination[1]}`
    element.addEventListener('click', (e) => {
      this.onClickLine(origin[0], origin[1], destination[0], destination[1], this.currentPlayer)
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
    let element = document.createElement('div')
    element.className = 'block'
    element.id = `block-${x}-${y}`
    parent.appendChild(element)
    return element
  }

  this.createRowElement = function (parent) {
    let element = document.createElement('div')
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
    this.container.classList.remove('red')
    this.container.classList.remove('blue')
    this.currentPlayerElement.classList.remove('red')
    this.currentPlayerElement.classList.remove('blue')
    this.otherPlayerElement.classList.remove('red')
    this.otherPlayerElement.classList.remove('blue')

    if (currentPlayer === 'blue') {
      this.container.classList.add('blue')
      this.currentPlayerElement.classList.add('blue')
      this.currentPlayerElement.innerText = `Blue: ${this.points['blue']}`
      this.otherPlayerElement.classList.add('red')
      this.otherPlayerElement.innerText = `Red: ${this.points['red']}`
    } else {
      this.container.classList.add('red')
      this.currentPlayerElement.classList.add('red')
      this.currentPlayerElement.innerText = `Red: ${this.points['red']}`
      this.otherPlayerElement.classList.add('blue')
      this.otherPlayerElement.innerText = `Blue: ${this.points['blue']}`
    }
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
  }

  this.save = function () {
    window.localStorage.setItem('data', JSON.stringify(this.serialize()))
  }

  this.load = function () {
    this.unserialize(JSON.parse(window.localStorage.getItem('data')))
  }
}

let game = new GridGame()

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

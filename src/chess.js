import { Chess } from 'chess.js'
import './chessboard/js/chessboard-1.0.0.js'
import $ from 'jquery'
import events from './event-driven/events.js'

class ChessGame {
    constructor(config) {
        this.game = new Chess()
        this.chessBoard = Chessboard('board', config)
        this.moves = []
        this.white = undefined
        this.black = undefined
        config.onDragStart = this.onDragStart.bind(this)
        config.onDrop = this.onDrop.bind(this)
        config.onMouseoutSquare = this.onMouseoutSquare.bind(this)
        config.onMouseoverSquare = this.onMouseoverSquare.bind(this)
        config.onSnapEnd = this.onSnapEnd.bind(this)
    }

    whiteSquareGrey = '#a9a9a9'
    blackSquareGrey = '#696969'


    onDragStart(source, piece, position, orientation) {
        // do not pick up pieces if the game is over
        if (this.game.isGameOver()) return false

        if ((this.game.turn() === 'w' && piece.search(/^b/) !== -1 && this.white !== undefined && this.white !== events.getUser().uid) ||
            (this.game.turn() === 'b' && piece.search(/^w/) !== -1 && this.black !== undefined && this.black !== events.getUser().uid)) {
            return false
        }

        // check if the piece has legal moves available
        const moves = this.game.moves({ square: source, verbose: true })
        if (moves.length === 0) return false
        return true
    }

    onDrop(source, target) {
        // see if the move is legal

        if (source === target) return 'cancel'
        this.removeGreySquares()

        let movement = {
            from: source,
            to: target,
            promotion: 'q', // NOTE: always promote to a queen for example simplicity
            turn: this.moves.length,
            color: this.game.turn()
        }

        try {
            var move = this.game.move(movement)
        } catch (e) {
            // illegal move
            return 'snapback'
        }

        // illegal move
        if (move === null) return 'snapback'

        events.addEvent("movePiece", movement)

        // this.updateStatus()
    }

    processMove(move, user) {
        // move 0 set white user
        // move 1 set black user
        if (this.moves.length === 0) {
            this.white = user
        } else if (this.moves.length === 1) {
            this.black = user
        }

        if (this.moves.length === move.turn && this.game.turn() !== move.color) {
            if ((move.color === 'w' && this.white !== user) || (move.color === 'b' && this.black !== user)) {
                console.log('Invalid move 1')
                return
            }

            this.updateStatus()
        } else if ((this.moves.length === move.turn && this.game.turn() === move.color)) {
            if ((move.color === 'w' && this.white !== user) || (move.color === 'b' && this.black !== user)) {
                console.log('Invalid move 2')
                return
            }

            // see if the move is legal
            if (move.from === move.to) return 'cancel'

            try {
                var move = this.game.move(move)
            }
            catch (e) {
                // illegal move
                return 'snapback'
            }

            // illegal move
            if (move === null) return 'snapback'

            this.chessBoard.position(this.game.fen())
            this.updateStatus()
        } else {
            console.log('Invalid move 3')
            return
        }
    }

    onSnapEnd() {
        this.chessBoard.position(this.game.fen())
    }

    updateStatus() {
        var status = ''
        this.redSquare?.css('background', '')
        this.redSquare = null

        var moveColor = 'White'
        if (this.game.turn() === 'b') {
            moveColor = 'Black'
        }

        // checkmate?
        if (this.game.isCheckmate()) {
            status = 'Game over, ' + moveColor + ' is in checkmate.'
        }

        // draw?
        else if (this.game.isDraw()) {
            status = 'Game over, drawn position'
        }

        // game still on
        else {
            status = moveColor + ' to move'

            // check?
            if (this.game.isCheck()) {
                status += ', ' + moveColor + ' is in check'
                // get king and paint it yellow
                let piece = this.game.turn() + 'K'
                let position = Chessboard.fenToObj(this.game.fen())
                let kingSquare = Object.keys(position).find(square => position[square] === piece)

                this.redSquare = $('#board .square-' + kingSquare)
                this.redSquare?.css('background', 'yellow')
            }
        }

        document.getElementById('status').innerText = status

        const moves = this.game.history({ verbose: true })
        this.moves.push({ fen: this.game.fen(), move: moves.at(-1) })

        // Update PGN table
        const pgnTableBody = document.getElementById('pgn')
        pgnTableBody.innerHTML = ''
        for (let i = 0; i < this.moves.length; i += 2) {
            const row = document.createElement('tr')
            const moveNumberCell = document.createElement('td')
            moveNumberCell.textContent = (i / 2 + 1).toString()
            const whiteMoveCell = document.createElement('td')

            whiteMoveCell.textContent = this.moves[i].move.san
            whiteMoveCell.dataset.fen = this.moves[i].fen
            const blackMoveCell = document.createElement('td')
            blackMoveCell.textContent = this.moves[i + 1] ? this.moves[i + 1].move.san : ''
            blackMoveCell.dataset.fen = this.moves[i + 1] ? this.moves[i + 1].fen : ''
            row.appendChild(moveNumberCell)
            row.appendChild(whiteMoveCell)
            row.appendChild(blackMoveCell)
            pgnTableBody.appendChild(row)
        }

        // Update FEN
        document.getElementById('fen').innerText = this.game.fen()
    }

    removeGreySquares() {
        $('#board .square-55d63').css('background', '')
        this.redSquare?.css('background', 'yellow')
    }

    greySquare(square) {
        var $square = $('#board .square-' + square)

        var background = this.whiteSquareGrey
        if ($square.hasClass('black-3c85d')) {
            background = this.blackSquareGrey
        }

        $square.css('background', background)
    }

    onMouseoverSquare(square, piece) {
        // get list of possible moves for this square
        var moves = this.game.moves({
            square: square,
            verbose: true
        })

        let user = events.getUser().uid
        if ((this.game.turn() === 'w' && this.white !== user && this.white !== undefined) ||
            (this.game.turn() === 'b' && this.black !== user && this.black !== undefined)) {
            return
        }

        // exit if there are no moves available for this square
        if (moves.length === 0) return

        // highlight the square they moused over
        this.greySquare(square)

        for (const move of moves) {
            this.greySquare(move.to)
        }
    }

    onMouseoutSquare(square, piece) {
        this.removeGreySquares()
    }

    endGame() {
        events.endgame()
        this.game.reset()
        this.chessBoard.start()
        this.moves = []
        document.getElementById('pgn').innerHTML = '' // Clear the PGN table
    }
}

export default ChessGame
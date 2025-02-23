import './style.css'
import './chessboard/css/chessboard-1.0.0.css'
import ChessGame from './chess.js'

var config = {
  pieceTheme: '/chesspieces/wikipedia/{piece}.png',
  position: 'start',
  draggable: true,
}

let game = new ChessGame(config)
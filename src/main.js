import './style.css'
import './chessboard/css/chessboard-1.0.0.css'
import ChessGame from './chess.js'

var config = {
  pieceTheme: '/chesspieces/wikipedia/{piece}.png',
  position: 'start',
  draggable: true,
}


document.getElementById('fen-button').addEventListener('click', () => {
  const fenText = document.getElementById('fen').innerText
  navigator.clipboard.writeText(fenText).then(() => {
    alert('FEN copied to clipboard')
  }).catch(err => {
    console.error('Failed to copy FEN: ', err)
  })
})

let game = null

document.getElementById('login-button').addEventListener('click', () => {
  document.getElementById('login-button').style.display = 'none';
  document.getElementById('logout-button').style.display = 'block';
  const boardInfo = document.getElementById('board-info');
  boardInfo.classList.remove('hidden');
  boardInfo.style.display = 'flex'; // Ensure it is displayed
  game = new ChessGame(config)
});

document.getElementById('logout-button').addEventListener('click', () => {
  document.getElementById('login-button').style.display = 'block';
  document.getElementById('logout-button').style.display = 'none';
  const boardInfo = document.getElementById('board-info');
  boardInfo.classList.add('hidden');
  boardInfo.style.display = 'none'; // Ensure it is hidden
  game.endGame()
  game = null
});
import './style.css'
import './chessboard/css/chessboard-1.0.0.css'
import ChessGame from './chess.js'
import events from './event-driven/events.js'
import { event } from 'jquery'
import { Chess } from 'chess.js'

var config = {
  pieceTheme: '/chesspieces/wikipedia/{piece}.png',
  position: 'start',
  draggable: true,
}

let game = null
let moveBoard = new ChessBoard('move-board', {position: 'start', draggable: false, pieceTheme: '/chesspieces/wikipedia/{piece}.png'})

/*const boardInfo = document.getElementById('board-info');
  boardInfo.classList.remove('hidden');
  boardInfo.style.display = 'flex'; // Ensure it is displayed
  game = new ChessGame(config)*/

document.getElementById('fen-button').addEventListener('click', () => {
  const fenText = document.getElementById('fen').innerText
  navigator.clipboard.writeText(fenText).then(() => {
    alert('FEN copied to clipboard')
  }).catch(err => {
    console.error('Failed to copy FEN: ', err)
  })
})

document.addEventListener('click', (event) => {
  if (event.target.tagName === 'TD' && event.target.dataset.fen) {
    const modal = document.getElementById('move-modal');
    const modalContent = document.getElementById('move-fen');
    modalContent.innerText = event.target.dataset.fen;
    modal.style.display = 'block';
    moveBoard.position(event.target.dataset.fen);
  }
});

document.querySelector('.close').addEventListener('click', () => {
  const modal = document.getElementById('move-modal');
  modal.style.display = 'none';
});

window.addEventListener('click', (event) => {
  const modal = document.getElementById('move-modal');
  if (event.target === modal) {
    modal.style.display = 'none';
  }
});

document.getElementById('copy-fen-button').addEventListener('click', () => {
  const fenText = document.getElementById('move-fen').innerText;
  navigator.clipboard.writeText(fenText).then(() => {
    alert('FEN copied to clipboard');
  }).catch(err => {
    console.error('Failed to copy FEN: ', err);
  });
});

document.getElementById('start-game-button').addEventListener('click', async () => {
  // alert('Start Game button clicked');
  
  const seed = {position: 'start'}
  const room = await events.createGame(seed);
  if (room) {
    // alert('Game created with room code: ' + room);
    document.getElementById('room-code').innerText = room;
    document.getElementById('room-indicator').style.display = 'block';

    document.getElementById('start-game-button').style.display = 'none';
    document.getElementById('join-game-button').style.display = 'none';
    document.getElementById('leave-game-button').style.display = 'block';

    // display board
    const boardInfo = document.getElementById('board-info');
    boardInfo.classList.remove('hidden');
    boardInfo.style.display = 'flex'; // Ensure it is displayed

    game = new ChessGame(config);
  }
  
  // Add logic to start a new game

  //

  // start game
});
  
document.getElementById('join-game-button').addEventListener('click', async () => {
  /*const room = prompt('Enter room code:');
  if (room) {
    const success = await events.joinGame(room);
    if (success) {
      alert('Joined game with room code: ' + room);
      document.getElementById('room-code').innerText = room;
      document.getElementById('room-indicator').style.display = 'block';

      game = new ChessGame(config);
    } else {
      alert('Failed to join game');
    }
  }
  
  // Add logic to join an existing game
  document.getElementById('start-game-button').style.display = 'none';
  document.getElementById('join-game-button').style.display = 'none';
  document.getElementById('leave-game-button').style.display = 'block';*/
});

function leaveGame () {
  if (game) {
    game.endGame();
    game = null;
  }

  // Add logic to leave the current game
  document.getElementById('leave-game-button').style.display = 'none';
  document.getElementById('start-game-button').style.display = 'block';
  document.getElementById('join-game-button').style.display = 'block';
  document.getElementById('room-code').innerText = 'None';
  document.getElementById('room-indicator').style.display = 'none';

  const boardInfo = document.getElementById('board-info');
  boardInfo.classList.add('hidden');
  boardInfo.style.display = 'none'; // Ensure it is hidden
}

document.getElementById('leave-game-button').addEventListener('click', leaveGame);

function updateLoginStatus() {
  if (events.isLoggedIn()) {
    document.getElementById('login-button').style.display = 'none';
    document.getElementById('logout-button').style.display = 'block';
  } else {
    document.getElementById('login-button').style.display = 'block';
    document.getElementById('logout-button').style.display = 'none';
  }
}

document.getElementById('login-button').addEventListener('click', async () => {
  /*
  const boardInfo = document.getElementById('board-info');
  boardInfo.classList.remove('hidden');
  boardInfo.style.display = 'flex'; // Ensure it is displayed
  game = new ChessGame(config)*/
  events.googleLogIn();
});

document.getElementById('logout-button').addEventListener('click', async () => {
  /*document.getElementById('login-button').style.display = 'block';
  document.getElementById('logout-button').style.display = 'none';
  const boardInfo = document.getElementById('board-info');
  boardInfo.classList.add('hidden');
  boardInfo.style.display = 'none'; // Ensure it is hidden
  game.endGame()
  game = null*/
  leaveGame();
  events.logOut();
});

events.init();
events.addAuthCallback(updateLoginStatus);

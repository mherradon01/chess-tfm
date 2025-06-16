import './style.css'
import './chessboard/css/chessboard-1.0.0.css'
import ChessGame from './chess.js'
import events from './event-driven/events.js'
import { event } from 'jquery'

let game = null
let moveBoard = new ChessBoard('move-board', { position: 'start', draggable: false, pieceTheme: '/chesspieces/wikipedia/{piece}.png' })
let selectedRoomId = null;

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

document.querySelectorAll('.close').forEach(closeButton => {
  closeButton.addEventListener('click', () => {
    closeButton.closest('.modal').style.display = 'none';
    // Clear selection when closing the modal
    document.querySelectorAll('.selectable').forEach(item => item.classList.remove('selected'));
    document.getElementById('join-selected-room-button').style.display = 'none';
    document.getElementById('delete-selected-room-button').style.display = 'none';
  });
});

window.addEventListener('click', (event) => {
  document.querySelectorAll('.modal').forEach(modal => {
    if (event.target === modal) {
      modal.style.display = 'none';
      // Clear selection when closing the modal
      document.querySelectorAll('.selectable').forEach(item => item.classList.remove('selected'));
      document.getElementById('join-selected-room-button').style.display = 'none';
      document.getElementById('delete-selected-room-button').style.display = 'none';
    }
  });
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


  const seed = {
    pieceTheme: '/chesspieces/wikipedia/{piece}.png',
    position: 'start',
    draggable: true,
  }
  const room = await events.createGame(seed);
  if (room) {
    // alert('Game created with room code: ' + room);
    document.getElementById('room-code').innerText = room;
    document.getElementById('room-indicator').style.display = 'block';

    document.getElementById('start-game-button').style.display = 'none';
    document.getElementById('join-game-button').style.display = 'none';
    document.getElementById('leave-game-button').style.display = 'block';
    document.getElementById('my-games-button').style.display = 'none';
    document.getElementById('list-rooms-button').style.display = 'none'; // Ensure list rooms button is hidden
    document.getElementById('reset-game-button').style.display = 'block'; // Ensure reset button is visible

    // display board
    const boardInfo = document.getElementById('board-info');
    boardInfo.classList.remove('hidden');
    boardInfo.style.display = 'flex'; // Ensure it is displayed

    game = new ChessGame(seed);
    events.addEventCallback(onEvent);

    document.getElementById('load-fen-button').style.display = 'block'; // Show Load FEN button
  }
});

function onEvent(type, event) {
  // check if game exists and event is timestamped
  if (!game || !event.timestamp) return;

  if (type === 'added' || type === 'modified') {
    if (event.type === 'movePiece') {
      game.processMove(event.data, event.user, event.username);
    } else if (event.type === 'rollback') {
      if (event.user === game.white || event.user === game.black) {
        game.rollbackToPosition(event.data.fen, event.user);
      }
    } else if (event.type === 'resetGame') {
      if (event.user === game.white || event.user === game.black) {
        game.resetGame(event.user);
      }
    } else if (event.type === 'loadFEN') {
      if (event.user === game.white || event.user === game.black) {
        game.loadFEN(event.data.fen, event.user);
      }
    }
  }
}

document.getElementById('join-game-button').addEventListener('click', async () => {
  // const seed = {position: 'start'}
  let roomcode = prompt('Enter the room code:');
  const room = await events.loadGame(roomcode);

  if (room) {
    // alert('Game created with room code: ' + room);
    document.getElementById('room-code').innerText = room;
    document.getElementById('room-indicator').style.display = 'block';

    document.getElementById('start-game-button').style.display = 'none';
    document.getElementById('join-game-button').style.display = 'none';
    document.getElementById('leave-game-button').style.display = 'block';
    document.getElementById('list-rooms-button').style.display = 'none'; // Ensure list rooms button is hidden
    document.getElementById('my-games-button').style.display = 'none';

    // display board
    const boardInfo = document.getElementById('board-info');
    boardInfo.classList.remove('hidden');
    boardInfo.style.display = 'flex'; // Ensure it is displayed

    let seed = events.getSeed();

    game = new ChessGame(seed);

    let moves = await events.getAllEvents();

    let date = moves.date;
    moves = moves.events;

    for (let i = 0; i < moves.length; i++) {
      if (moves[i].type === 'movePiece') {
        game.processMove(moves[i].data, moves[i].user);
      } else if (moves[i].type === 'rollback') {
        game.rollbackToPosition(moves[i].data.fen, moves[i].user);
      }
      //onEvent('added', moves[i]);
    }

    events.addEventCallback(onEvent);
    events.suscribeEvents(date);

    document.getElementById('reset-game-button').style.display = 'block'; // Ensure reset button is visible
    document.getElementById('load-fen-button').style.display = 'block'; // Show Load FEN button
  }
});

document.getElementById('list-rooms-button').addEventListener('click', async () => {
  const rooms = await events.listRooms();
  const roomsList = document.getElementById('rooms-list');
  roomsList.innerHTML = '';
  document.getElementById('rooms-modal').style.display = 'block';

  if (rooms === null || rooms.length === 0) {
    const listItem = document.createElement('p');
    listItem.textContent = 'No rooms available';
    roomsList.appendChild(listItem);
    return; 
  }

  rooms.forEach(room => {
    const listItem = document.createElement('li');
    const createdAt = room.createdAt ? new Date(room.createdAt.seconds * 1000).toLocaleString() : 'Unknown';
    listItem.textContent = `Room ID: ${room.id} (Created at: ${createdAt})`;
    listItem.dataset.roomId = room.id;
    listItem.classList.add('selectable');
    listItem.addEventListener('click', () => {
      document.querySelectorAll('.selectable').forEach(item => item.classList.remove('selected'));
      listItem.classList.add('selected');
      selectedRoomId = room.id;
      document.getElementById('join-selected-room-button').style.display = 'block';
      document.getElementById('delete-selected-room-button').style.display = 'none';
    });
    roomsList.appendChild(listItem);
  });
});

document.getElementById('my-games-button').addEventListener('click', async () => {
  const rooms = await events.myRooms();
  const roomsList = document.getElementById('rooms-list');
  roomsList.innerHTML = '';
  document.getElementById('rooms-modal').style.display = 'block';

  if (rooms === null || rooms.length === 0) {
    const listItem = document.createElement('p');
    listItem.textContent = 'No rooms available';
    roomsList.appendChild(listItem);
    return;
  }

  rooms.forEach(room => {
    const listItem = document.createElement('li');
    const createdAt = room.createdAt ? new Date(room.createdAt.seconds * 1000).toLocaleString() : 'Unknown';
    listItem.textContent = `Room ID: ${room.id} (Created at: ${createdAt})`;
    listItem.dataset.roomId = room.id;
    listItem.classList.add('selectable');
    listItem.addEventListener('click', () => {
      document.querySelectorAll('.selectable').forEach(item => item.classList.remove('selected'));
      listItem.classList.add('selected');
      selectedRoomId = room.id;
      document.getElementById('join-selected-room-button').style.display = 'block';
      document.getElementById('delete-selected-room-button').style.display = 'block';
    });
    roomsList.appendChild(listItem);
  });
});

document.getElementById('join-selected-room-button').addEventListener('click', async () => {
  if (selectedRoomId) {
    const room = await events.loadGame(selectedRoomId);
    if (room) {
      document.getElementById('room-code').innerText = room;
      document.getElementById('room-indicator').style.display = 'block';

      document.getElementById('start-game-button').style.display = 'none';
      document.getElementById('join-game-button').style.display = 'none';
      document.getElementById('my-games-button').style.display = 'none';
      document.getElementById('list-rooms-button').style.display = 'none';
      document.getElementById('leave-game-button').style.display = 'block';

      const boardInfo = document.getElementById('board-info');
      boardInfo.classList.remove('hidden');
      boardInfo.style.display = 'flex';

      let seed = events.getSeed();
      game = new ChessGame(seed);

      let moves = await events.getAllEvents();
      let date = moves.date;
      moves = moves.events;

      for (let i = 0; i < moves.length; i++) {

        onEvent('added', moves[i]);
        /*if (moves[i].type === 'movePiece') {
          game.processMove(moves[i].data, moves[i].user);
        } else if (moves[i].type === 'rollback') {
          game.rollbackToPosition(moves[i].data.fen);
        } else if (moves[i].type === 'resetGame') {
          game.resetGame();
        } else if (moves[i].type === 'loadFEN') {
          game.loadFEN(moves[i].data.fen);
        }*/
      }
      game.updateStatus(false);

      events.addEventCallback(onEvent);
      events.suscribeEvents(date);

      document.getElementById('reset-game-button').style.display = 'block';
      document.getElementById('rooms-modal').style.display = 'none';
      document.getElementById('load-fen-button').style.display = 'block'; // Show Load FEN button
    }
  }
});

document.getElementById('delete-selected-room-button').addEventListener('click', async () => {
  if (selectedRoomId) {
    await events.deleteRoom(selectedRoomId);
    document.getElementById('rooms-modal').style.display = 'none';
    alert('Room deleted successfully');
  }
});

document.getElementById('load-fen-button').addEventListener('click', () => {
  const fen = prompt('Enter the FEN string:');
  if (fen) {
    events.addEvent("loadFEN", { fen: fen });
  }
});

function leaveGame() {
  if (game) {
    game.endGame();
    game = null;
  }

  // Add logic to leave the current game
  document.getElementById('leave-game-button').style.display = 'none';
  document.getElementById('start-game-button').style.display = 'block';
  document.getElementById('join-game-button').style.display = 'block';
  document.getElementById('my-games-button').style.display = 'block';
  document.getElementById('list-rooms-button').style.display = 'block'; // Ensure list rooms button is visible
  document.getElementById('room-code').innerText = 'None';
  document.getElementById('room-indicator').style.display = 'none';

  const boardInfo = document.getElementById('board-info');
  boardInfo.classList.add('hidden');
  boardInfo.style.display = 'none'; // Ensure it is hidden

  document.getElementById('reset-game-button').style.display = 'none'; // Hide reset button
  document.getElementById('load-fen-button').style.display = 'none'; // Hide Load FEN button
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

document.getElementById('rollback-button').addEventListener('click', () => {
  const user = events.getUser().uid;
  if (user === game.white || user === game.black) {
    const fenText = document.getElementById('move-fen').innerText;
    events.addEvent("rollback", { fen: fenText });
    const modal = document.getElementById('move-modal');
    modal.style.display = 'none';
  } else {
    alert('Only players can perform this action.');
  }
});

document.getElementById('reset-game-button').addEventListener('click', () => {
  const user = events.getUser().uid;
  if (user === game.white || user === game.black) {
    events.addEvent("resetGame", {});
  } else {
    alert('Only players can perform this action.');
  }
});

events.init();
events.addAuthCallback(updateLoginStatus);

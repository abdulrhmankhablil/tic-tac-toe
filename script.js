// script.js - Tic Tac Toe (modular, testable, accessible)
// No globals — everything is wrapped. Uses localStorage to persist names & scores.
// Usage: open index.html, enter names, Start Game, click or keyboard to place marks.

(() => {
  // --- Utilities ---
  const qs = (sel) => document.querySelector(sel);
  const qsa = (sel) => Array.from(document.querySelectorAll(sel));

  // --- Player factory ---
  const Player = (name = 'Player', marker = 'X') => {
    return {
      getName: () => name,
      getMarker: () => marker,
      setName: (v) => { name = String(v).slice(0, 20) || name; },
    };
  };

  // --- Gameboard module (singleton) ---
  const Gameboard = (() => {
    let board = Array(9).fill('');
    const getBoard = () => board.slice();
    const setMark = (index, marker) => {
      if (index < 0 || index > 8) return false;
      if (board[index] !== '') return false;
      board[index] = marker;
      return true;
    };
    const reset = () => { board = Array(9).fill(''); };
    const isFull = () => board.every(Boolean);
    const at = (idx) => board[idx];
    return { getBoard, setMark, reset, isFull, at };
  })();

  // --- Game controller (singleton) ---
  const GameController = (() => {
    const WIN_COMBOS = [
      [0,1,2],[3,4,5],[6,7,8],
      [0,3,6],[1,4,7],[2,5,8],
      [0,4,8],[2,4,6]
    ];

    let players = [];
    let active = 0;
    let over = true;
    let scores = { X:0, O:0, ties:0 };

    // checkWinner returns null or { winner: 'X'|'O', combo: [i,j,k] }
    const checkWinner = () => {
      const b = Gameboard.getBoard();
      for (const combo of WIN_COMBOS) {
        const [a,b1,c] = combo;
        if (b[a] && b[a] === b[b1] && b[a] === b[c]) {
          return { winner: b[a], combo };
        }
      }
      return null;
    };

    const init = (p1Name, p2Name, persistedScores) => {
      const p1 = Player(p1Name || 'Player 1', 'X');
      const p2 = Player(p2Name || 'Player 2', 'O');
      players = [p1, p2];
      active = 0;
      over = false;
      Gameboard.reset();
      if (persistedScores) scores = Object.assign(scores, persistedScores);
    };

    const getActive = () => players[active];
    const getPlayers = () => players.slice();
    const isOver = () => over;
    const getScores = () => Object.assign({}, scores);

    const switchPlayer = () => { active = 1 - active; };

    const playRound = (index) => {
      if (over) return { success: false, reason: 'game-over' };
      const marker = getActive().getMarker();
      const ok = Gameboard.setMark(index, marker);
      if (!ok) return { success: false, reason: 'occupied-or-invalid' };

      const winnerInfo = checkWinner();
      if (winnerInfo) {
        over = true;
        scores[winnerInfo.winner] = (scores[winnerInfo.winner] || 0) + 1;
        return { success: true, result: 'win', winnerInfo };
      }

      if (Gameboard.isFull()) {
        over = true;
        scores.ties++;
        return { success: true, result: 'tie' };
      }

      switchPlayer();
      return { success: true, result: 'continue' };
    };

    const resetScores = () => { scores = { X:0, O:0, ties:0 }; };

    return { init, getActive, getPlayers, playRound, isOver, checkWinner, resetScores, getScores, Gameboard };
  })();

  // --- Display controller (singleton) ---
  const DisplayController = (() => {
    // elements
    const boardEl = qs('#board');
    const statusEl = qs('#status');
    const startBtn = qs('#start-btn');
    const restartBtn = qs('#restart-btn');
    const p1Input = qs('#player1-name');
    const p2Input = qs('#player2-name');
    const scoreX = qs('#score-x');
    const scoreO = qs('#score-o');
    const scoreTies = qs('#score-ties');

    // persist keys
    const STORAGE_KEY = 'tic-tac-toe:v1';

    // keyboard-friendly board creation
    function createBoard() {
      boardEl.innerHTML = '';
      for (let i = 0; i < 9; i++) {
        const btn = document.createElement('button');
        btn.className = 'square';
        btn.setAttribute('role', 'gridcell');
        btn.setAttribute('aria-label', `Cell ${i+1}`);
        btn.setAttribute('data-index', String(i));
        btn.setAttribute('aria-pressed', 'false');
        btn.tabIndex = 0;
        btn.addEventListener('click', onSquareClick);
        btn.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            btn.click();
          }
        });
        boardEl.appendChild(btn);
      }
    }

    function renderBoard(winCombo = []) {
      const board = GameController.Gameboard.getBoard();
      const squares = Array.from(boardEl.children);
      squares.forEach((sq, i) => {
        sq.textContent = board[i];
        const taken = Boolean(board[i]);
        sq.classList.toggle('taken', taken);
        sq.setAttribute('aria-pressed', String(taken));
        sq.classList.toggle('win', winCombo.includes(i));
      });
      updateStatus();
      updateScores();
    }

    function updateStatus(winnerInfo = null, tie = false) {
      if (GameController.isOver()) {
        if (winnerInfo) {
          const players = GameController.getPlayers();
          const winningPlayer = players.find(p => p.getMarker() === winnerInfo.winner);
          statusEl.textContent = `${winningPlayer.getName()} (${winnerInfo.winner}) wins!`;
          statusEl.classList.add('win');
        } else if (tie) {
          statusEl.textContent = `It's a tie!`;
          statusEl.classList.remove('win');
        } else {
          statusEl.textContent = 'Game over';
        }
      } else {
        const active = GameController.getActive();
        statusEl.textContent = `${active.getName()}'s turn (${active.getMarker()})`;
        statusEl.classList.remove('win');
      }
    }

    function updateScores() {
      const scores = GameController.getScores();
      scoreX.textContent = scores.X ?? 0;
      scoreO.textContent = scores.O ?? 0;
      scoreTies.textContent = scores.ties ?? 0;
      // persist names + scores
      saveState();
    }

    function onSquareClick(e) {
      const index = Number(e.currentTarget.getAttribute('data-index'));
      const res = GameController.playRound(index);
      if (!res.success) {
        if (res.reason === 'occupied-or-invalid') {
          // gentle feedback
          const old = statusEl.textContent;
          statusEl.textContent = 'Square already taken!';
          setTimeout(() => { if (!GameController.isOver()) statusEl.textContent = old; else renderBoard(res.winnerInfo?.combo ?? []); }, 650);
        }
        return;
      }

      if (res.result === 'win') {
        renderBoard(res.winnerInfo.combo);
        updateStatus(res.winnerInfo, false);
      } else if (res.result === 'tie') {
        renderBoard([]);
        updateStatus(null, true);
      } else {
        renderBoard([]);
      }
    }

    // Start or restart game with current inputs
    function startGame(persisted = null) {
      const name1 = p1Input.value.trim() || 'Player 1';
      const name2 = p2Input.value.trim() || 'Player 2';
      const persistedScores = persisted?.scores ?? null;
      GameController.init(name1, name2, persistedScores);
      // set inputs to saved names (useful on restart)
      p1Input.value = name1;
      p2Input.value = name2;
      renderBoard([]);
    }

    function restartGame() {
      // restart using current inputs, keep scores
      const persisted = loadState();
      startGame({ scores: persisted?.scores });
    }

    // Save and load to localStorage
    function saveState() {
      try {
        const payload = {
          names: {
            p1: p1Input.value.trim(),
            p2: p2Input.value.trim()
          },
          scores: GameController.getScores()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch (err) { /* ignore */ }
    }

    function loadState() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
      } catch (err) { return null; }
    }

    // Initial wiring
    function bind() {
      startBtn.addEventListener('click', () => {
        const stored = loadState();
        if (stored?.names) {
          // allow input override; prefer provided inputs but fallback to storage
          p1Input.value = p1Input.value.trim() || stored.names.p1 || '';
          p2Input.value = p2Input.value.trim() || stored.names.p2 || '';
        }
        startGame(stored);
      });

      restartBtn.addEventListener('click', () => {
        // keep scores; names preserved
        restartGame();
      });

      // save input names as they change
      [p1Input, p2Input].forEach((el) => {
        el.addEventListener('input', () => saveState());
      });
    }

    function init() {
      createBoard();
      bind();
      // restore state if present
      const stored = loadState();
      if (stored?.names) {
        p1Input.value = stored.names.p1 || '';
        p2Input.value = stored.names.p2 || '';
      }
      // start with a cleared board and possibly persisted scores
      startGame(stored || null);

      statusEl.textContent = 'Press "Start Game" to begin';
    }

    return { init, renderBoard };
  })();

  // --- Initialize on DOM ready ---
  document.addEventListener('DOMContentLoaded', () => {
    DisplayController.init();
  });

  // Expose small object for testing (not on window)
  // If you want to run automated tests later, you can import or require the modules.
})();

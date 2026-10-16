# Tic Tac Toe (Browser)

A clean, accessible Tic Tac Toe game built with HTML, CSS and modular JavaScript. The project separates game logic (Gameboard, GameController, Player) from the DOM (DisplayController), keeps minimal global scope, and persists player names and scores to localStorage.

Features
- Modular game logic (easy to unit test)
- Keyboard accessible board (Tab + Enter/Space)
- Winning line highlight and clear visual feedback
- Player name inputs and persistent scores (localStorage)
- Start and Restart controls
- Simple responsive, modern UI

Files
- index.html — main markup
- style.css — polished responsive styles
- script.js — modular JavaScript (Gameboard, GameController, DisplayController)
- README.md — this file
- .gitignore — recommended ignores

How to run
1. Save files to a project folder.
2. Open `index.html` in your browser.

Git (recommended)
In the project folder run:
```
git init
git add .
git commit -m "Initial Tic Tac Toe: modular game logic and polished UI"
```

Optional: create a GitHub repo and push.

Possible next steps
- Add unit tests (Jest) for Gameboard and GameController.
- Add AI opponent with difficulty levels (minimax for unbeatable).
- Add animations for winning lines and transitions.
- Add server sync (leaderboard) or multiplayer.

If you want, I can create a GitHub repository for this and push all files — tell me the repo name and whether it should be public or private.

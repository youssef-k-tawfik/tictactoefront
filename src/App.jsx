import { useState, useEffect } from "react";
import "./App.css";
import Square from "./components/Square/Square";
import { io } from "socket.io-client";

const socket = io("https://0ed9-41-44-210-95.ngrok-free.app");

function App() {
  const [gameState, setGameState] = useState({
    squares: Array(9).fill(""),
    xTurn: true,
  });
  const [secondPlayerJoined, setSecondPlayerJoined] = useState(false);
  const [room, setRoom] = useState("");
  const [playerSymbol, setPlayerSymbol] = useState("");
  const [firstToPlay, setFirstToPlay] = useState(true);
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    // Check connection
    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    socket.on("resetGame", (firstToPlay) => {
      setGameState({ squares: Array(9).fill(""), xTurn: firstToPlay });
      setWinner(null);
      const gameCells = document.querySelectorAll("button.cell");
      gameCells.forEach((cell) => {
        cell.removeAttribute("disabled");
      });
    });

    socket.on("gameReady", ({ squares, xTurn }) => {
      setGameState({ squares: squares, xTurn: xTurn });
      setSecondPlayerJoined(true);
    });

    socket.on("waitingForOpponent", () => {
      setSecondPlayerJoined(false);
    });

    socket.on("updateGame", ({ newGameStat, winner }) => {
      setGameState({ squares: newGameStat.squares, xTurn: newGameStat.xTurn });
      if (winner) {
        setWinner(winner);
        // ? >>> stop game interactivity
        const gameCells = document.querySelectorAll("button.cell");
        gameCells.forEach((cell) => {
          cell.setAttribute("disabled", "true");
        });
      } else {
        setWinner(null);
      }
    });

    return () => {
      socket.off("resetGame");
      socket.off("gameReady");
      socket.off("waitingForOpponent");
      socket.off("updateGame");
      socket.off("connect_error");
    };
  }, []);

  function handleTurnClick(i) {
    if (
      gameState.squares[i] ||
      (gameState.xTurn && playerSymbol !== "X") ||
      (!gameState.xTurn && playerSymbol !== "O")
    ) {
      return;
    }
    updateSquares(i);
  }

  function updateSquares(i) {
    let arr = [...gameState.squares];
    arr[i] = gameState.xTurn ? "X" : "O";
    const newGameStat = { squares: arr, xTurn: !gameState.xTurn };
    setGameState(newGameStat);
    socket.emit("updateGame", { room, newGameStat, playerSymbol });
  }

  function restartGame() {
    setFirstToPlay(!firstToPlay);
    setGameState({ squares: Array(9).fill(""), xTurn: firstToPlay });
    socket.emit("newGame", { room, firstToPlay });
  }

  function createRoom() {
    const roomName = prompt("Enter room name:");
    if (roomName) {
      setRoom(roomName);
      setPlayerSymbol("X");
      socket.emit("createRoom", roomName);
      setSecondPlayerJoined(false);
    }
  }

  function joinRoom() {
    const roomName = prompt("Enter room name to join:");
    if (roomName) {
      setRoom(roomName);
      setPlayerSymbol("O");
      socket.emit("joinRoom", roomName);
    }
  }

  const GAME = (
    <>
      <p>
        You play with: {playerSymbol} & current turn is:{" "}
        {gameState.xTurn ? "X" : "O"}
      </p>
      {winner && <p>Winner is {winner}</p>}
      <div id="board" className="grid grid-cols-3 gap-0 w-fit mx-auto">
        {gameState.squares.map((s, i) => (
          <Square value={s} i={i} key={i} onClick={handleTurnClick} />
        ))}
      </div>
    </>
  );

  return (
    <main>
      <div className="container text-center py-4 flex flex-col gap-8">
        <h1>Tic-Tac-Toe by S0NA</h1>
        <div className="flex gap-2 justify-center">
          {secondPlayerJoined && (
            <button className="btn" onClick={restartGame}>
              New Game
            </button>
          )}
          <button className="btn" onClick={createRoom}>
            Create Room
          </button>
          <button className="btn" onClick={joinRoom}>
            Join Room
          </button>
        </div>
        {secondPlayerJoined && (
          <p>
            Current Room: <span className="text-blue-700">{room}</span>
          </p>
        )}
        {secondPlayerJoined && GAME}
      </div>
    </main>
  );
}

export default App;

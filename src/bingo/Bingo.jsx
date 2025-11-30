import { useState, useEffect } from 'react';
import './BingoStyle.css';

// obtains random questions for the board
function questionsForBoard(pool, size) {
  const questionsNeeded = (size * size) - 1;
  const selected = [];
  const usedIndex = new Set();

  while (selected.length < questionsNeeded) {
    const ind = Math.floor(Math.random() * pool.length);
    if (!usedIndex.has(ind)) {
      selected.push(pool[ind]);
      usedIndex.add(ind);
    }
  }

  return selected;
}

// create normal cell
function createCell(question, answer) {
  return { question, answer, marked: false };
}

// create the free cell
function freeCell() {
  return { question: 'Free', answer: null, marked: true };
}

// question pool generation
function generateQuestionPool(maxAnswer, size,operation) {
  const QA = [];
  const used = new Set();
  const usedAnswers = new Set();
  const questionsNeeded = (size * size) - 1;

  for (let a = 1; a <= maxAnswer; a++) {
    for (let b = 1; b <= maxAnswer; b++) {
      let answer, question;
      switch(operation){
        case 'addition':
          question = `${a} + ${b}`;
          answer = a + b;
          break;
        case 'subtraction':
          question = `${a} - ${b}`;
          answer = a - b;
          question = `${a} - ${b}`;
          answer = a - b;
          break;
        case 'multiplication':
          question = `${a} x ${b}`;
          answer = a * b;
          break;
        case 'division':
          if (b !== 0 ) {
            if(Math.random() < .8){
              b = Math.floor(Math.random()* (maxAnswer-1)) +2;
            }
            else{
              b = 1;
            }
            let temp = a;
            let q = a * b;
            question = `${q} / ${b}`;
            answer = a;
          } else {
            continue;
          }
          break;
      }

      if (!used.has(question) && !usedAnswers.has(answer)) {
        QA.push([question, answer]);
        used.add(question);
        usedAnswers.add(answer);
      }
    }
  }

  // Shuffle QA
  for (let i = QA.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [QA[i], QA[j]] = [QA[j], QA[i]];
  }

  return QA.slice(0, questionsNeeded * 2);
}

// Generate full board
function generateBoard(maxAnswer, size = 5, operation) {
  if (size < 5 || size % 2 === 0) {
    throw new Error('Board size must be an odd number >= 5.');
  }

  const pool = generateQuestionPool(maxAnswer, size, operation);
  const selectedQuestions = questionsForBoard(pool, size);
  const board = [];
  let qIndex = 0;
  const center = Math.floor((size - 1) / 2);

  for (let row = 0; row < size; row++) {
    board[row] = [];
    for (let col = 0; col < size; col++) {
      if (row === center && col === center) {
        board[row][col] = freeCell();
      } else {
        const [question, answer] = selectedQuestions[qIndex];
        board[row][col] = createCell(question, answer);
        qIndex++;
      }
    }
  }
  for (let row = 0; row < size; row++) {
    board[row] = [];
    for (let col = 0; col < size; col++) {
      if (row === center && col === center) {
        board[row][col] = freeCell();
      } else {
        const [question, answer] = selectedQuestions[qIndex];
        board[row][col] = createCell(question, answer);
        qIndex++;
      }
    }
  }

  return board;
}

// The Bingo component
export default function Bingo({ maxAnswer = 10, size = 5, operation, difficulty }) {
  const [board, setBoard] = useState([]);
  const [questionPool, setQuestionPool] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(10);
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [turn, setTurn] = useState("player");
  const [cpuQuestion, setCpuQuestion] = useState(null);
  const [cpuTimeLeft, setCpuTimeLeft] = useState(0);
  const [cpuBoard, setCpuBoard] = useState([]);
  const [cpuThinkTime, setCpuThinkTime] = useState(0);
  const [cpuPool, setCpuPool] = useState([]);


  {/*ran into an error with computer's turns allowing them the chance for double turns, this was definitely a bug so hopefully trying to fix with a boolean that should hopefully prevent double turns. Basically like a semaphore */ }
  const [cpuFlag, setCpuFlag] = useState(false);
  {/*creating a semaphore for stealFlag for when a player tries to steal a computer's turn, need it for if they get it wrong/right, wrong comes with painful consequences */ }
  const [stealFlag, setStealFlag] = useState(false);



  const difficultyCPUTime = { easy: 8, medium: 5, hard: 3 };

  useEffect(() => {
    const newBoard = generateBoard(maxAnswer, size, operation);
    const pool = generateQuestionPool(maxAnswer, size, operation);
    setBoard(newBoard);
    setQuestionPool(pool);
  }, [maxAnswer, size, operation]);

  function startGame() {
    const newBoard = generateBoard(maxAnswer, size, operation);
    const newCpuBoard = generateBoard(maxAnswer, size, operation);
    const pool = generateQuestionPool(maxAnswer, size, operation);
    const cpuPool = [...pool];
    const cpuTime = difficultyCPUTime[difficulty] || 5;

    setCpuThinkTime(cpuTime);
    setBoard(newBoard);
    setCpuBoard(newCpuBoard);
    setQuestionPool(pool);
    setCpuPool(cpuPool);
    setCurrentQuestion(null);
    setUserAnswer('');
    setScore(0);
    setTimeLeft(10);
    setGameOver(false);
    setGameActive(true);
    setTurn("player");
    startTurn();
  }

  function startTurn() {
    if (questionPool.length === 0 || gameOver) return;
    const randex = Math.floor(Math.random() * questionPool.length);
    const nextQ = questionPool[randex];
    const updated = [...questionPool];
    updated.splice(randex, 1);
    setQuestionPool(updated);
    setCurrentQuestion(nextQ);
    setTimeLeft(10);
  }

  useEffect(() => {
    if (!currentQuestion) return;

    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, currentQuestion]);

function handleSubmit() {
  if (!currentQuestion || gameOver || turn !== "player") return;

  const userAns = parseInt(userAnswer);
  const correctA = currentQuestion[1];

  // --- PLAYER SCORING (stealFlag = false) ---
  if (!stealFlag) {
    if (userAns === correctA) {
      const points = calculateScore(Math.abs(correctA), timeLeft, 10);
      setScore(prev => prev + points);
    } else {
      setScore(prev => Math.max(prev - 10, 0));
    }
  }

 

  finishPlayerTurn(userAns);
}


function finishPlayerTurn(userAns) {
  const correctA = currentQuestion[1];

  setBoard(prev => {
    const newBoard = prev.map(row =>
      row.map(cell => {
        if (cell.answer === correctA && userAns === correctA) {
          return { ...cell, marked: true };
        } else if (cell.answer === userAns && userAns !== correctA) {
          return { ...cell, wrong: true };
        }
        return cell;
      })
    );

    if (checkWin(newBoard)) {
      setGameOver(true);
      setGameActive(false);
      setCurrentQuestion(null);
      setCpuFlag(false);
      setStealFlag(false);

      setTimeout(() => alert("Bingo! You win!"), 50);
    }

    return newBoard;
  });


  // Cleanup
  setUserAnswer('');
  setStealFlag(false);
  setCpuFlag(false);

  // Move to CPU turn
  if (!gameOver) {
    setTurn("cpu");
    startCPUTurn();
  }
}

  // Check win functions
  function checkRowWin(board) { return board.some(row => row.every(cell => cell.marked)); }
  function checkColWin(board) {
    const n = board.length;
    for (let col = 0; col < n; col++) {
      if (board.every(row => row[col].marked)) return true;
    }
    return false;
  }
  function checkMainDiagonalWin(board) { return board.every((row, i) => row[i].marked); }
  function checkAntiDiagonalWin(board) {
    const n = board.length;
    return board.every((row, i) => row[n - 1 - i].marked);
  }

  function checkWin(board) { return checkRowWin(board) || checkColWin(board) || checkMainDiagonalWin(board) || checkAntiDiagonalWin(board); }

  function calculateScore(answer, timeLeft, maxTime = 10) {
    let points;

  points = Math.ceil(answer * (timeLeft / maxTime));
    

  return points;
  }

  function calculateStolenScore(answer){
    return answer+35;
  }



  {/*computer's turn, sets both Cpuflag and StealFlag to true, pulls questions from the computer's question pool. */ }
function startCPUTurn() {
  if (cpuFlag || cpuPool.length === 0 || gameOver) return;

  setCpuFlag(true);
  setStealFlag(true);

  const rand = Math.floor(Math.random() * cpuPool.length);
  const next = cpuPool[rand];
  const updated = [...cpuPool];
  updated.splice(rand, 1);

  setCpuPool(updated);
  setCpuQuestion(next);
  setCpuTimeLeft(cpuThinkTime);

  // CPU COUNTDOWN TIMER
  const intervalId = setInterval(() => {
    setCpuTimeLeft(prev => {
      if (prev === 0) {
        clearInterval(intervalId);
        if(Math.random()>= .8){

        cpuFinishTurn(next);
         return 0;
        }    else
           setTurn("player");
    startTurn();     // ← player’s next question
    return 0;
       
      }
      return prev - 1;
    });
  }, 1000);

  // Return cleanup for interrupts (steal)
  return () => clearInterval(intervalId);
}




  {/*After the alloted time for the computer, it will enter this function which will finish its turn, setting the semaphore(cpuFlag) to true and setting the turn to player's turn  */ }
function cpuFinishTurn(question) {
  if (turn !== "cpu" || gameOver) return;

  const correctA = question[1];

  setCpuBoard(prev => {
    const updated = prev.map(row =>
      row.map(cell =>
        cell.answer === correctA ? { ...cell, marked: true } : cell
      )
    );

    if (checkWin(updated)) {
      setGameOver(true);
      setCpuFlag(false);
      setStealFlag(false);

      setTimeout(() => alert("CPU wins!"), 50);
    }

    return updated;
  });

  if (!gameOver) {
    setCpuFlag(false);
    setStealFlag(false);
    setCpuQuestion(null);
    setTurn("player");
    startTurn();     // ← player’s next question
  }
}



  {/* function that allows the player to steal answers during the computer's turn, allows for the blocking of the computer to add a spot to their board.  */ }
function playerSteal() {
  if (turn !== "cpu" || !cpuQuestion) return;

  const playerAns = parseInt(userAnswer);
  const correctA = cpuQuestion[1];

  if (playerAns === correctA) {
          const extraPoints = Math.ceil((correctA * 2)/1.5);
     
      setScore(prev => prev + extraPoints);
    // successful steal → cancel CPU turn
    setCpuQuestion(null);
    setStealFlag(false);
    setCpuFlag(false);
    setTurn("player");
    startTurn();
  }
  if(playerAns !== correctA && playerAns !== null){
    setScore(prev => prev - 50);
  }

  setUserAnswer('');
}


  if (!board.length) return <div>Loading Bingo board...</div>;
  if (!board.length) return <div>Loading Bingo board...</div>;

  return (
    <div className="bingo-container">
      <h2 className="bingo-title">Bingo Game</h2>

      {/* Controls */}
      <div className="bingo-controls">
        {!currentQuestion && <button onClick={startGame}>Start Game</button>}
        {/*Player's Question is taken from their question pool.  */}
        {turn === 'player' && currentQuestion && (
          <div className="question-box">
            <p>Player's Turn</p>
            <p>{currentQuestion[0]}</p>
            <p>Time left: {timeLeft}s</p>
            <input
              type="text"
              value={userAnswer}
              onChange={e => setUserAnswer(e.target.value)}
              placeholder="Your answer"
            />
            <button onClick={handleSubmit}>Submit</button>
          </div>
        )}
        {/*Computer has their own separate question pool, as to not conflict with the player's*/}
        {turn === 'cpu' && cpuQuestion && (
          <div className="cpu-question-box">
            <p>Computer's Turn</p>
            <p>{cpuQuestion[0]}</p>
            <p>Time Left: {cpuTimeLeft}</p>
            <input
              type="text"
              value={userAnswer}
              onChange={e => setUserAnswer(e.target.value)}
              placeholder="Interrupt Answer"
            />
            <button onClick={playerSteal}>Steal!</button>
          </div>
        )}

        <p>Player's Score: {score}</p>
      </div>

      {/* Boards side by side */}
      <div className="boards-container">
        {/*This is the creation of the player's board */}
        <div className="player-board">
          <p>Player's Board</p>
          {board.map((row, rIndex) => (
            <div key={rIndex} className="bingo-row">
              {row.map((cell, cIndex) => (
                <div
                  key={cIndex}
                  className={`bingo-cell ${cell.marked ? 'marked' : ''} ${cell.wrong ? 'wrong' : ''}`}
                >
                  {cell.answer !== null ? cell.answer : cell.question}
                </div>
              ))}
            </div>
          ))}
        </div>
        {/*This is the creation of the computer's board */}
        <div className="cpu-board">
          <p>Computer's Board</p>
          {cpuBoard.map((row, rIndex) => (
            <div key={rIndex} className="bingo-row">
              {row.map((cell, cIndex) => (
                <div
                  key={cIndex}
                  className={`bingo-cell ${cell.marked ? 'marked' : ''}`}
                >
                  {cell.answer !== null ? cell.answer : cell.question}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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

// create normal cell;
function createCell(question, answer) {
  return { question, answer, marked: false };
}

// create the free cell;
function freeCell() {
  return { question: 'Free', answer: null, marked: true };
}

// question pool generation
function generateQuestionPool(maxAnswer, size,operation) {
  const QA = [];
  const used = new Set();
  const usedAnswers = new Set();
  const questionsNeeded = (size * size) - 1;

  // computes all possible products, but unique products.
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
          break;
        case 'multiplication':
          question = `${a} x ${b}`;
          answer = a * b;
          
          break;
        case 'division':
  if(b !== 0 && a % b === 0){
let a = Math.floor(Math.random() * 35)+1;
let b =  Math.floor(Math.random() * 35)+1;
let temp = a * b;

question = `${temp} / ${b} `;
answer = a;
        }else{
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

  // Shuffle the QA array
  for (let i = QA.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [QA[i], QA[j]] = [QA[j], QA[i]];
  }

  // Return only as many questions as needed
  return QA.slice(0, questionsNeeded * 2);
}

// Generate the full board
function generateBoard(maxAnswer, size = 5,operation) {
  if (size < 5 || size % 2 === 0) {
    throw new Error('Board size must be an odd number >= 5.');
  }

  const pool = generateQuestionPool(maxAnswer, size,operation);
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

  return board;
}




// The Bingo component
export default function Bingo({ maxAnswer = 10, size = 5,operation, difficulty}) {
  const [board, setBoard] = useState([]);
  const [questionPool, setQuestionPool] = useState([]);
  const[currentQuestion, setCurrentQuestion] = useState(null);
  const[userAnswer, setUserAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(10);
  const [score,setScore] = useState(0);
  const[gameActive, setGameActive] = useState(false);
  const[gameOver, setGameOver] = useState(false);
  const[turn,setTurn] = useState("player")
  const[cpuQuestion, setCpuQuestion] = useState(null)
  const[cpuTimeLeft,setCpuTimeLeft] = useState(0)
  const [cpuBoard, setCpuBoard] = useState([]);
  const [cpuThinkTime,setCpuThinkTime] = useState(0)
  const[cpuPool,setCpuPool] = useState([]);
    const difficultyCPUTime = {
      easy:8,
      medium : 5,
      hard : 3
    }
  
  useEffect(() => {
    const newBoard = generateBoard(maxAnswer, size,operation);
    const pool = generateQuestionPool(maxAnswer, size,operation);
    setBoard(newBoard);
    setQuestionPool(pool);
  }, [maxAnswer, size,operation]);

  function startGame(){
    const newBoard = generateBoard(maxAnswer, size,operation);
    const newCpuBoard =  generateBoard(maxAnswer, size,operation);
    const pool = generateQuestionPool(maxAnswer, size,operation);
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
  if(!currentQuestion) return;
  if(timeLeft <= 0){
    handleSubmit();
    return;

  }
  const timer = setTimeout(() => setTimeLeft(t => t -1),1000);
  return () => clearTimeout(timer);
  }, [timeLeft, currentQuestion]);



function handleSubmit() {
  if (!currentQuestion || gameOver) return;

  const userAns = parseInt(userAnswer);
  const correctA = currentQuestion[1];

  setBoard(prev => {
    // compute new board
    const newBoard = prev.map(row =>
      row.map(cell => {
        if (cell.answer === correctA && userAns === correctA) {
          return { ...cell, marked: true }; // correct
        } else if (cell.answer === userAns && userAns !== correctA) {
          return { ...cell, wrong: true }; // wrong
        }
        return cell;
      })
    );

    // Check for Bingo on the updated board
    if (checkWin(newBoard)) {
      setGameOver(true);
      setGameActive(false);
      setCurrentQuestion(null);
      alert("Bingo! You win!");
    }

    return newBoard;
  });

  // Update score
  if (userAns === correctA) {
    const points = calculateScore(correctA, timeLeft, 10);
    setScore(prev => prev + points);
  } else {
    setScore(prev => Math.max(prev - 10, 0));
  }

  setUserAnswer('');
  setTurn("cpu");
  startCPUTurn();
}


///////////////////////////////////////////
//check win condition sections
function checkRowWin(board){
  for(let i = 0; i < board.length;i++){
    if(board[i].every(cell => cell.marked)){
      return true;
    }
  }
  return false;
}

function checkColWin(board){
  const n = board.length;

  for(let col = 0; col < n; col++){
    let allMarked = true;
    for(let row = 0; row < n; row++){
      if(!board[row][col].marked){
        allMarked = false;
        break;
      }
    }
    if(allMarked) return true;
  }
  return false;
}

function checkMainDiagonalWin(board){
const n = board.length;
for(let i = 0;i < n; i++ ){
  if(!board[i][i].marked)
    return false;
}
return true;
}

function checkAntiDiagonalWin(board){
  const n = board.length;
  for( let i = 0; i < n;i++){
    if(!board[i][n-1 -i].marked)
      return false;
  }
  return true;
}
//check all function to check for every type of bingo
function checkWin(board){
  return(
    checkRowWin(board) ||
    checkColWin(board) ||
    checkMainDiagonalWin(board) ||
    checkAntiDiagonalWin(board)
  );
}
///////////////////////////////////////

//score calculation very simple, may change it later
function calculateScore(answer, timeLeft, maxTime = 10){


  const difsco = answer;
  const timeMulti = timeLeft/maxTime;

  return Math.ceil(difsco * timeMulti);
}




  if (!board.length) return <div>Loading Bingo board...</div>;

  return (
    <div className="bingo-container">
      <h2 className="bingo-title">Bingo Board</h2>


      {/* Game Controls */}
      <div className = "bingo-controls">
        {!currentQuestion && (
          <button onClick = {startGame}>Start Game</button>
        )}


      {turn === 'player' && currentQuestion && (
        <div className = "question-box">
           <p>Player's Turn</p>
          <p>{currentQuestion[0]}</p>
          <p> Time left: {timeLeft}s </p>
          <input 
          type = "text"
          value = {userAnswer}
          onChange = {e => setUserAnswer(e.target.value)}
          placeholder = "Your answer"
        />
        <button onClick = {handleSubmit}> Submit</button>
        </div>
      )}
      {turn === 'cpu' && cpuQuestion && (
        <div className = "cpu-question-box">
          <p>Computer's Turn</p>
          <p>{cpuQuestion[0]}</p>
          <p> Time Left: {cpuTimeLeft}</p>
          <input type = "text"
          value = {userAnswer}
          onChange = { e => setUserAnswer(e.target.value)}
          placeholder = "Interrupt Answer"
          />

          <button onClick = {playerSteal}>Steal!</button>
          </div>
      )}
      <p>Player's Score: {score} </p>
      <p>Player's Board</p>
      </div>
      {/* Bingo Board Display */ }
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
  
<p>Computer's Board</p>
  {/* Cpu Board Display */}
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
  );
function startCPUTurn() {
  if (cpuPool.length === 0 || gameOver) return;

  const rand = Math.floor(Math.random() * cpuPool.length);
  const next = cpuPool[rand];

  const updated = [...cpuPool];
  updated.splice(rand, 1);
  setCpuPool(updated);

  setCpuQuestion(next);
  setCpuTimeLeft(cpuThinkTime);

  const timer = setInterval(() => {
    setCpuTimeLeft(t => {
      if (t <= 1) {
        clearInterval(timer);
        cpuFinishTurn(next);
      }
      return t - 1;
    });
  }, 1000);
}


function playerSteal(){
  if(turn !== "cpu") 
    return;

  const playerAns = parseInt(userAnswer);
  const correctAns = cpuQuestion[1];


  if(playerAns === correctAns){
    setCpuQuestion(null);
    setTurn("player");
    startTurn();
  }
  setUserAnswer('');
}
function cpuFinishTurn(question) {
  if (turn !== "cpu") return;  // player might have interrupted

  const correctAns = question[1];

  setCpuBoard(prev => {
    const newBoard = prev.map(row => row.map(cell => {
        if (cell.answer === correctAns) {
          return { ...cell, marked: true };
        }
        return cell;
      })
    );
    //check to see if computer won. 
    if (checkWin(newBoard)) {
      alert("CPU wins!");
      setGameOver(true);
    }

    return newBoard;
  });

  // clear CPU question UI
  setCpuQuestion(null);

  // back to player's turn
  setTurn("player");
  startTurn();
}
}

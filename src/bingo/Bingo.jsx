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
          question = `${a} / ${b}`;
          answer = a / b;
          
        } else{
          continue;
        }
          break;
      }
    
      if (!used.has(question)) {
        QA.push([question, answer]);
        used.add(question);
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
export default function Bingo({ maxAnswer = 10, size = 5,operation }) {
  const [board, setBoard] = useState([]);
  const [questionPool, setQuestionPool] = useState([]);
  const[currentQuestion, setCurrentQuestion] = useState(null);
  const[userAnswer, setUserAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(10);
  const [score,setScore] = useState(0);
  const[gameActive, setGameActive] = useState(false);
  const[gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const newBoard = generateBoard(maxAnswer, size,operation);
    const pool = generateQuestionPool(maxAnswer, size,operation);
    setBoard(newBoard);
    setQuestionPool(pool);
  }, [maxAnswer, size,operation]);

  function startGame(){
    const newBoard = generateBoard(maxAnswer, size,operation);
    const pool = generateQuestionPool(maxAnswer, size,operation);
    setBoard(newBoard);
    setQuestionPool(pool);
    setCurrentQuestion(null);
    setUserAnswer('');
    setScore(0);
    setTimeLeft(10);
    setGameOver(false);
    setGameActive(true);

    startTurn();
  }
function startTurn(){

  //if the question pool is empty, return
  if(questionPool.length == 0 || gameOver){
    return;
  }
//randex is a random index # based off the length of questionpool. 
//nextQ is a random question from questionpool using randex.
  const randex = Math.floor(Math.random()* questionPool.length);
  const nextQ = questionPool[randex];


  const updatePool = [...questionPool];
  updatePool.splice(randex, 1);
  setQuestionPool(updatePool);
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
  startTurn();
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

      { currentQuestion && (
        <div className = "question-box">
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

      <p>Score: {score} </p>
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
    </div>
  );
}

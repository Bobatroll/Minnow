import { useState } from 'react';
import Bingo from './Bingo';
import './BingoStyle.css';

export default function BingoGame() {
  const [gameSettings, setGameSettings] = useState(null);

  function handleStart(settings) {
    setGameSettings(settings);
  }
//sets the settings to null and goes back to Menu screen 
  function handleBackToMenu() {
    setGameSettings(null);
  }

  return (
    <div className="game-wrapper">
      {!gameSettings ? (
        <CreateGameScreen onStart={handleStart} />
      ) : (
        <Bingo 
          maxAnswer={gameSettings.maxAnswer} 
          size={5} 
          operation={gameSettings.operation}
          difficulty={gameSettings.difficulty}
          onExit={handleBackToMenu}
        />
      )}
    </div>
  );
}

function CreateGameScreen({ onStart }) {
  const [operation, setOperation] = useState('multiplication');
  const [difficulty, setDifficulty] = useState('medium');
  const [customMax,setCustomMax] = useState(10);

  const difficultyMap = {
    easy: 10,
    medium: 15,
    hard: 20
  };

  function handleStartClick() {
     const maxAnswer = difficulty === 'custom' ? Number(customMax) : difficultyMap[difficulty];
    const settings = {
     
      operation,
      maxAnswer,
      difficulty
    };
    onStart(settings);
  }

  return (
    <div className="create-game">
      <h2>Create Your Bingo Game</h2>

      <div className="option-group">
        <label>Operation:</label>
        <select value={operation} onChange={e => setOperation(e.target.value)}>
          <option value="multiplication">Multiplication</option>
          <option value="division">Division</option>
          <option value="addition">Addition</option>
          <option value="subtraction">Subtraction</option>
        </select>
      </div>

      <div className="option-group">
        <label>Difficulty:</label>
        <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
          <option value="easy">Easy (1–10)</option>
          <option value="medium">Medium (1–15)</option>
          <option value="hard">Hard (1–20)</option>
          <option value= "custom">Custom</option>
           </select>
          {difficulty === 'custom' && (
            <input type ="number"
            min ="1"
            value = {customMax}
            onChange = {e => setCustomMax(e.target.value)}
            placeholder = "Enter max Number"
            />
          )}
       
      </div>

      <button onClick={handleStartClick}>Start Game</button>
    </div>
  );
}

import { useState } from 'react'
import { useEffect } from 'react'





function generateQuestionPool(maxAnswer, size ){
    
    let QA = new Map();
    let usedProducts = new Set();
    const questionsNeeded = (size * size) -1;
//generates the random products
while(QA.size < questionsNeeded * 2){
let a = Math.floor(Math.random() * (maxAnswer + 1));
let b = Math.floor(Math.random() * (maxAnswer + 1));

    let product = a * b;
  
    
//checks if the products are unique, if they are then a question is generated and they are added to the Question/Answer map and the usedProducts set. 
    if(!usedProducts.has(product)){
          let question = "What is " + a.toString() + " x " + b.toString() + " ?";
        QA.set(question, product);
        usedProducts.add(product);
    }
}

return Array.from(QA.entries());

}

////////////////////////

function questionsForBoard(pool, size){
    const boardsize = size * size;
    const questionsNeeded = boardsize - 1;
    let selected = [];
    let usedIndex = new Set();

    while(selected.length < questionsNeeded){
        const ind = Math.floor(Math.random() * pool.length);
        if(!usedIndex.has(ind)){
            selected.push(pool[ind]);
            usedIndex.add(ind);
        }
    }

    return selected;
}



/////////////////////////////////////////////////
function createCell ( question, answer){
    return {
        question: question,
        answer: answer,
        marked: false
    };
}



//////////////////////////////////////////////////
function freeCell(){
    return{
        question: "Free",
        answer : null,
        marked : true}
    };


////////////////////////////////////////////////


function generateBoard(maxAnswer, size = 5){ // using 40 until can figure out variable to call to it. 

 console.log("Generating board with size:", size);
    if(size < 5 || size % 2 == 0){
        throw new Error("Board size must be an odd number greater than or equal to 5.");
    }
const totalcells = size * size;
const questionsNeeded = totalcells -1;



const pool = generateQuestionPool(maxAnswer,size);


const selectedQuestions = questionsForBoard(pool,size);

let board = [];
let qIndex = 0;
let center = Math.floor((size-1)/2); 

for(let row = 0; row < size;row++){
    board[row] = [];

for(let col = 0; col < size; col ++){
    if (row == center && col == center){
        board[row][col] = freeCell();
    }
    else{
        const[question,answer] = selectedQuestions[qIndex];
        board[row][col] = createCell(question,answer);
        qIndex++;
        }
    }
}

return board;

}




function App() {
    const [board, setBoard] = useState([]);

    useEffect(() => {
        const newBoard = generateBoard(10, 5);
        setBoard(newBoard);
        console.log(newBoard); // Optional: see the board in the console too
    }, []);

    return (
        <div>
            <h2>Bingo Board</h2>
            {board.map((row, rIndex) => (
                <div key={rIndex} style={{ display: 'flex' }}>
                    {row.map((cell, cIndex) => (
                        <div
                            key={cIndex}
                            style={{
                                border: '1px solid black',
                                width: '100px',
                                height: '50px',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                margin: '2px',
                                backgroundColor: cell.marked ? '#aaffaa' : '#ffffff',
                            }}
                        >
                            {cell.question}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}
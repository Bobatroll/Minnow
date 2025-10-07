import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import Bingo from './bingo/Bingo';

function App() {
  return (
    <div>
      <Bingo maxAnswer={10} size={5} />
    </div>
  );
}

export default App;

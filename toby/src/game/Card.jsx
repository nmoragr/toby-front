import './Card.css'
import { useState, useContext } from 'react'
import CardButton from './CardButton'
import { GameContext } from './Board';

export default function Card({id, imgSrc}){
  const [showImage, setShowImage] = useState(true);

  const {
    guess,
    setGuess } = useContext(GameContext);
  

  const toggleImage =() => {
    setShowImage(!showImage);
  }

  const handleGuess = () => {
    setGuess(id);
  }

    return(
    <div className="card">
      <div className="card-container">
        {showImage && <img src={imgSrc} className="img" alt="avatar"/>}
      </div>
      <div className="card-actions">
      <CardButton onClick={toggleImage} showImage={showImage}/>
      {showImage && <CardButton onClick={handleGuess} label="Adivinar" />}
      </div>
    </div>
  )
}
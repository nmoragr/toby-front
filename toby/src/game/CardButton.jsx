import './CardButton.css';

export default function CardButton({onClick, showImage, label}){
  return(
    <div>
      <button onClick={onClick}>
        {label || (showImage ? 'Ocultar' : 'Mostrar')}
      </button>
    </div>

  );
}
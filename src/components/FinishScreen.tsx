interface FinishScreenProps {
  onRestart: () => void;
}

export default function FinishScreen({ onRestart }: FinishScreenProps) {
  return (
    <div className="finish-screen">
      <div className="finish-icon">🍺</div>
      <h2 className="finish-title">That's a wrap!</h2>
      <p className="finish-sub">Hope everyone survived.</p>
      <button className="primary-btn finish-btn" onClick={onRestart}>
        Play Again
      </button>
    </div>
  );
}

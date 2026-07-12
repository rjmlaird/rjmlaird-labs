type SimControlsProps = {
  running: boolean;
  onToggleRun: () => void;
  onReset: () => void;
  onStep?: () => void;
  timeScale?: number;
  onTimeScaleChange?: (value: number) => void;
};

export default function SimControls({ running, onToggleRun, onReset, onStep, timeScale, onTimeScaleChange }: SimControlsProps) {
  return (
    <>
      <div className="button-row">
        <button type="button" onClick={onToggleRun}>
          {running ? 'Pause' : 'Run'}
        </button>
        {onStep && (
          <button type="button" onClick={onStep}>
            Step
          </button>
        )}
        <button type="button" onClick={onReset}>
          Reset
        </button>
      </div>
      {onTimeScaleChange && timeScale !== undefined && (
        <label>
          Time scale
          <input
            type="range"
            min="0.25"
            max="3"
            step="0.25"
            value={timeScale}
            onChange={(e) => onTimeScaleChange(Number(e.target.value))}
          />
          <span>{timeScale.toFixed(2)}×</span>
        </label>
      )}
      <p className="hint">Space = play/pause &middot; R = reset</p>
    </>
  );
}

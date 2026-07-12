import React from 'react';

type ToggleProps = {
  running: boolean;
  onToggle: () => void;
};

export default function Toggle({ running, onToggle }: ToggleProps) {
  return (
    <button type="button" onClick={onToggle}>
      {running ? 'Pause' : 'Run'}
    </button>
  );
}

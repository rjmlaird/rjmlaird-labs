export interface PresetOption { id: string; label: string; description: string }

export interface PresetPickerProps {
  value: string;
  presets: PresetOption[];
  onChange: (id: string) => void;
}

export function PresetPicker({ value, presets, onChange }: PresetPickerProps) {
  const current = presets.find((p) => p.id === value) ?? presets[0];
  return (
    <>
      <label>
        Preset
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          {presets.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
      </label>
      {current && <p className="hint">{current.description}</p>}
    </>
  );
}

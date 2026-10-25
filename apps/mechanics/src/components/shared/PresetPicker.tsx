type PresetOption = {
  id: string;
  label: string;
  description: string;
};

type PresetPickerProps = {
  value: string;
  presets: PresetOption[];
  onChange: (id: string) => void;
};

export default function PresetPicker({ value, presets, onChange }: PresetPickerProps) {
  const current = presets.find((p) => p.id === value) ?? presets[0];
  return (
    <>
      <label>
        Preset
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          {presets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </select>
      </label>
      {current && <p className="hint">{current.description}</p>}
    </>
  );
}

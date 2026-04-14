import { useState } from "react";

interface Props {
  label: string;
  placeholder: string;
  tags: string[];
  onChange: (tags: string[]) => void;
}

export default function TagInput({ label, placeholder, tags, onChange }: Props) {
  const [input, setInput] = useState("");

  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput("");
  };

  const remove = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="flex gap-2 mb-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          className="flex-1 border rounded px-3 py-2 text-sm"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={add}
          className="bg-gray-200 px-3 py-2 rounded text-sm hover:bg-gray-300"
        >
          Add
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs flex items-center gap-1"
            >
              {tag}
              <button
                type="button"
                onClick={() => remove(tag)}
                className="text-blue-400 hover:text-blue-600"
              >
                x
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

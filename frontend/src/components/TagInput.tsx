import { Plus, XClose } from "@untitledui/icons";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
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
    <div className="space-y-3">
      <p className="text-sm font-medium text-primary">{label}</p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          className="sm:flex-1"
          wrapperClassName="sm:flex-1"
          placeholder={placeholder}
        />
        <Button type="button" tone="secondary" iconLeading={Plus} onClick={add}>
          Add
        </Button>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} tone="blue" className="gap-1.5 pr-1">
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => remove(tag)}
                className="inline-flex size-5 items-center justify-center rounded-full text-blue-500 transition hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900"
              >
                <XClose className="size-3.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

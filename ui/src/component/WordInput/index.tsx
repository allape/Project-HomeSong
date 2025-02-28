import { Input, InputProps, Tag } from "antd";
import { ReactElement, useEffect, useState } from "react";

export interface IWordInputProps
  extends Omit<InputProps, "value" | "onChange"> {
  value?: string;
  onChange?: (value?: string) => void;
}

export default function WordInput({
  value,
  onChange,
  ...props
}: IWordInputProps): ReactElement {
  const [words, setWords] = useState<string[]>([]);

  useEffect(() => {
    if (!value) {
      setWords([]);
      return;
    }

    setWords(value.split(/\s+/).filter((i) => !!i));
  }, [value]);

  return (
    <>
      <Input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        {...props}
      />
      <div style={{ paddingTop: "5px" }}>
        {words.map((word) => (
          <Tag
            key={word}
            onClick={() => onChange?.(word)}
            style={{ cursor: "pointer" }}
          >
            {word}
          </Tag>
        ))}
      </div>
    </>
  );
}

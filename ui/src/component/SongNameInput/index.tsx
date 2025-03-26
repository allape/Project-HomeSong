import { Input, InputProps, Tag } from "antd";
import { ReactElement, useMemo } from "react";

export interface ISongNameInputProps
  extends Omit<InputProps, "value" | "onChange"> {
  value?: string;
  onChange?: (value: string) => void;
  splitter?: RegExp;
}

export default function SongNameInput({
  splitter,
  value,
  onChange,
  ...props
}: ISongNameInputProps): ReactElement {
  const formattedName = useMemo(() => {
    return value?.replace(splitter || /\s*([-&])\s*/gi, " $1 ") || "";
  }, [splitter, value]);
  return (
    <div>
      <div>
        <Input
          {...props}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
        />
      </div>
      {formattedName && (
        <div style={{ paddingTop: "10px" }}>
          <Tag
            style={{ cursor: "pointer" }}
            onClick={() => onChange?.(formattedName)}
          >
            {formattedName}
          </Tag>
        </div>
      )}
    </div>
  );
}

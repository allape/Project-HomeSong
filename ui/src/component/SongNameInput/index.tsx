import { Input, InputProps } from "antd";
import { ReactElement, useMemo } from "react";
import CopyButton from "../CopyButton";

export interface ISongNameInputProps
  extends Omit<InputProps, "value" | "onChange"> {
  copyOnClick?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  splitter?: RegExp;
}

export default function SongNameInput({
  copyOnClick = true,
  splitter,
  value,
  onChange,
  ...props
}: ISongNameInputProps): ReactElement {
  const formattedName = useMemo(() => {
    return value?.trim().replace(splitter || /\s*([-&])\s*/gi, " $1 ") || "";
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
        <CopyButton
          style={{ marginTop: "10px" }}
          value={copyOnClick ? formattedName : undefined}
          onClick={() => onChange?.(formattedName)}
        >
          {formattedName}
        </CopyButton>
      )}
    </div>
  );
}

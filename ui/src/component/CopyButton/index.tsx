import { stringify } from "@allape/gocrud";
import { CopyOutlined } from "@ant-design/icons";
import { App, Button, ButtonProps } from "antd";
import { PropsWithChildren, ReactElement } from "react";
import { useTranslation } from "react-i18next";

export interface ICopyButtonProps extends Omit<ButtonProps, "value"> {
  value?: string | (() => string);
  okText?: string;
}

export default function CopyButton({
  value,
  okText,
  onClick,
  children,
  ...props
}: PropsWithChildren<ICopyButtonProps>): ReactElement {
  const { t } = useTranslation();
  const { message } = App.useApp();
  return (
    <Button
      {...props}
      size="small"
      type="link"
      onClick={(e) => {
        onClick?.(e);
        const v = value instanceof Function ? value() : value;
        return v
          ? navigator.clipboard
              ?.writeText(v)
              .then(() => message.success(okText || t("copied")))
              .catch((e) => message.error(stringify(e)))
          : undefined;
      }}
    >
      {children || <CopyOutlined />}
    </Button>
  );
}

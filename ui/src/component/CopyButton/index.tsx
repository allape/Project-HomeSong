import { stringify } from "@allape/gocrud";
import { CopyOutlined } from "@ant-design/icons";
import { App, Button } from "antd";
import { PropsWithChildren, ReactElement } from "react";
import { useTranslation } from "react-i18next";

export interface ICopyButtonProps {
  value?: string | (() => string);
  okText?: string;
}

export default function CopyButton({
  value,
  okText,
  children,
}: PropsWithChildren<ICopyButtonProps>): ReactElement {
  const { t } = useTranslation();
  const { message } = App.useApp();
  return (
    <Button
      size="small"
      type="link"
      onClick={() => {
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

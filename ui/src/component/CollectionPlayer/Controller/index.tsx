import {
  AudioOutlined,
  FireOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { Button } from "antd";
import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import styles from "./style.module.scss";

export type ViewType = "lyrics" | "list";

export interface IControllerProps {
  view?: ViewType;
  shuffle?: boolean;
  onShuffle?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onViewChange?: (view: ViewType) => void;
}

export default function Controller({
  view,
  shuffle,
  onShuffle,
  onPrev,
  onNext,
  onViewChange,
}: IControllerProps): ReactElement {
  const { t } = useTranslation();
  return (
    <div className={styles.wrapper}>
      <Button
        title={t("player.prev")}
        type="link"
        size="large"
        className={styles.button}
        onClick={onPrev}
      >
        <StepBackwardOutlined />
      </Button>
      {view == "list" && (
        <Button
          title={t("player.list")}
          type="link"
          className={styles.button}
          onClick={() => onViewChange?.("lyrics")}
        >
          <UnorderedListOutlined />
        </Button>
      )}
      {view == "lyrics" && (
        <Button
          title={t("player.lyrics")}
          type="link"
          danger
          className={styles.button}
          onClick={() => onViewChange?.("list")}
        >
          <AudioOutlined />
        </Button>
      )}
      <Button
        title={t("player.shuffle")}
        type="link"
        danger={shuffle}
        className={styles.button}
        onClick={onShuffle}
      >
        <FireOutlined />
      </Button>
      <Button
        title={t("player.next")}
        type="link"
        className={styles.button}
        onClick={onNext}
      >
        <StepForwardOutlined />
      </Button>
    </div>
  );
}

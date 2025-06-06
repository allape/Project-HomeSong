import {
  AudioOutlined,
  FireOutlined,
  RetweetOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  StopOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { Button } from "antd";
import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import styles from "./style.module.scss";

export type ViewType = "lyrics" | "list";

export type LoopType = "shuffle" | "list" | "no";

export interface IControllerProps {
  view?: ViewType;
  loop?: LoopType;
  onLoopChange?: (lt: LoopType) => void;
  onNext?: () => void;
  onPrev?: () => void;
  onViewChange?: (view: ViewType) => void;
}

export default function Controller({
  view,
  loop,
  onLoopChange,
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
      {loop === "shuffle" && (
        <Button
          title={t("player.loopType.shuffle")}
          type="link"
          danger
          className={styles.button}
          onClick={() => onLoopChange?.("list")}
        >
          <FireOutlined />
        </Button>
      )}
      {loop === "list" && (
        <Button
          title={t("player.loopType.list")}
          type="link"
          danger
          className={styles.button}
          onClick={() => onLoopChange?.("no")}
        >
          <RetweetOutlined />
        </Button>
      )}
      {loop === "no" && (
        <Button
          title={t("player.loopType.no")}
          type="link"
          className={styles.button}
          onClick={() => onLoopChange?.("shuffle")}
        >
          <StopOutlined />
        </Button>
      )}
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

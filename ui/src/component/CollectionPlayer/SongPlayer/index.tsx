import {
  FireOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
} from "@ant-design/icons";
import { Button, Tooltip } from "antd";
import cls from "classnames";
import {
  ReactElement,
  SyntheticEvent,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useTranslation } from "react-i18next";
import { IModifiedSong } from "../model.ts";
import SongPlayEventEmitter from "./eventemitter.ts";
import styles from "./style.module.scss";

export interface ISongPlayerProps {
  shadow?: boolean;
  shuffle?: boolean;
  song?: IModifiedSong;
  emitter?: SongPlayEventEmitter;
  onNext?: () => void;
  onPrev?: () => void;
  onShuffle?: () => void;
  onChange?: (playing: boolean) => void;
}

export default function SongPlayer({
  shadow,
  shuffle,
  song,
  emitter,
  onPrev,
  onNext,
  onShuffle,
  onChange,
}: ISongPlayerProps): ReactElement {
  const { t } = useTranslation();

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const handlePlay = () => {
      audioRef.current?.play().then();
    };
    const handlePause = () => {
      audioRef.current?.pause();
    };
    const handleStop = () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
    const handleNext = () => {
      onNext?.();
    };
    const handlePrev = () => {
      onPrev?.();
    };
    const handleSeekTo = (details: MediaSessionActionDetails) => {
      if (audioRef.current) {
        audioRef.current.currentTime = details.seekTime || 0;
      }
    };

    navigator.mediaSession.setActionHandler("play", handlePlay);
    navigator.mediaSession.setActionHandler("pause", handlePause);
    navigator.mediaSession.setActionHandler("stop", handleStop);
    navigator.mediaSession.setActionHandler("previoustrack", handlePrev);
    navigator.mediaSession.setActionHandler("nexttrack", handleNext);
    navigator.mediaSession.setActionHandler("seekto", handleSeekTo);
    return () => {
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("stop", null);
      navigator.mediaSession.setActionHandler("previoustrack", null);
      navigator.mediaSession.setActionHandler("nexttrack", null);
      navigator.mediaSession.setActionHandler("seekto", null);
    };
  }, [audioRef, onNext, onPrev]);

  useEffect(() => {
    if (!song) {
      navigator.mediaSession.playbackState = "none";
      navigator.mediaSession.setPositionState(undefined);
      return;
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.name,
      artist: song._collections
        .filter((c) => c.type === "artist")
        .map((c) => c.name)
        .join(", "),
      album: song._collections
        .filter((c) => c.type === "album")
        .map((c) => c.name)
        .join(", "),
      artwork: song._cover
        ? [
            {
              src: song._cover,
              sizes: "96x96",
              type: "image/png",
            },
          ]
        : [],
    });
  }, [song]);

  const handlePlay = useCallback(() => {
    onChange?.(true);
    navigator.mediaSession.playbackState = "playing";
  }, [onChange]);

  const handlePause = useCallback(() => {
    onChange?.(false);
    navigator.mediaSession.playbackState = "paused";
  }, [onChange]);

  const handleEnded = useCallback(() => {
    onNext?.();
    onChange?.(false);
    navigator.mediaSession.playbackState = "none";
  }, [onChange, onNext]);

  const handleChange = useCallback((e: SyntheticEvent<HTMLAudioElement>) => {
    if (
      Number.isNaN(e.currentTarget.duration) ||
      Number.isNaN(e.currentTarget.currentTime)
    ) {
      return;
    }
    navigator.mediaSession.setPositionState({
      duration: e.currentTarget.duration,
      playbackRate: e.currentTarget.playbackRate,
      position: e.currentTarget.currentTime,
    });
  }, []);

  useEffect(() => {
    if (!emitter) {
      return;
    }

    const handlePlay = () => {
      audioRef.current?.play().then();
    };
    const handlePause = () => {
      audioRef.current?.pause();
    };
    const handleStop = () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
    emitter.addEventListener("play", handlePlay);
    emitter.addEventListener("pause", handlePause);
    emitter.addEventListener("stop", handleStop);
    return () => {
      emitter.removeEventListener("play", handlePlay);
      emitter.removeEventListener("pause", handlePause);
      emitter.removeEventListener("stop", handleStop);
    };
  }, [emitter]);

  return (
    <div className={cls(styles.wrapper, shadow && styles.shadow)}>
      <div className={styles.row}>
        <div className={styles.audio}>
          <audio
            autoPlay
            controls
            ref={audioRef}
            // key={song?.id}
            src={song?._url}
            className={styles.audio}
            onPlay={handlePlay}
            onPause={handlePause}
            onEnded={handleEnded}
            onTimeUpdate={handleChange}
          />
        </div>
      </div>
      <div className={styles.row}>
        <Tooltip title={t("player.prev")}>
          <Button
            type="link"
            size="large"
            className={cls(styles.button)}
            onClick={onPrev}
          >
            <StepBackwardOutlined />
          </Button>
        </Tooltip>
        <Tooltip title={t("player.shuffle")}>
          <Button
            type="link"
            danger={shuffle}
            className={cls(styles.button)}
            onClick={onShuffle}
          >
            <FireOutlined />
          </Button>
        </Tooltip>
        <Tooltip title={t("player.next")}>
          <Button type="link" className={cls(styles.button)} onClick={onNext}>
            <StepForwardOutlined />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}

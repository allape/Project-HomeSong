import { EEEventListener } from "@allape/gocrud-react/src/helper/eventemitter.ts";
import { useProxy } from "@allape/use-loading";
import { ReactElement, SyntheticEvent, useCallback, useEffect } from "react";
import { IModifiedSong } from "../model.ts";
import PlayerEventEmitter from "./eventemitter.ts";
import styles from "./style.module.scss";

export interface IPlayerProps {
  song?: IModifiedSong;
  emitter?: PlayerEventEmitter;
  onNext?: () => void;
  onPrev?: () => void;
  onChange?: (playing: boolean) => void;
  onDurationChange?: (duration: number) => void;
  onCurrentChange?: (current: number) => void;
  onAudioOk?: (audio: HTMLAudioElement | null) => void;
}

export default function Player({
  song,
  emitter,
  onPrev,
  onNext,
  onChange,
  onDurationChange,
  onCurrentChange,
  onAudioOk,
}: IPlayerProps): ReactElement {
  const [audio, audioRef, setAudio] = useProxy<HTMLAudioElement | null>(null);

  useEffect(() => {
    onAudioOk?.(audio);
  }, [audio, onAudioOk]);

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
      artist: song._singerNames,
      album: song._nonArtistNames,
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

  const handleChange = useCallback(
    (e: SyntheticEvent<HTMLAudioElement>) => {
      if (
        Number.isNaN(e.currentTarget.duration) ||
        Number.isNaN(e.currentTarget.currentTime)
      ) {
        return;
      }
      onDurationChange?.(e.currentTarget.duration);
      onCurrentChange?.(e.currentTarget.currentTime);
      navigator.mediaSession.setPositionState({
        duration: e.currentTarget.duration,
        playbackRate: e.currentTarget.playbackRate,
        position: e.currentTarget.currentTime,
      });
    },
    [onCurrentChange, onDurationChange],
  );

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

    const handleSeek: EEEventListener = (time) => {
      if (!audioRef.current) {
        return;
      }
      audioRef.current.currentTime = time.value as number;
    };

    emitter.addEventListener("play", handlePlay);
    emitter.addEventListener("pause", handlePause);
    emitter.addEventListener("stop", handleStop);
    emitter.addEventListener("seek", handleSeek);
    return () => {
      emitter.removeEventListener("play", handlePlay);
      emitter.removeEventListener("pause", handlePause);
      emitter.removeEventListener("stop", handleStop);
      emitter.removeEventListener("seek", handleSeek);
    };
  }, [audioRef, emitter]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.audio}>
        <audio
          autoPlay
          controls
          ref={setAudio}
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
  );
}

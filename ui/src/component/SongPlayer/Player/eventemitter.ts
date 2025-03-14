import { EventEmitter } from "@allape/gocrud-react";

export default class PlayerEventEmitter extends EventEmitter<
  "play" | "pause" | "stop" | "seek",
  number | unknown
> {}

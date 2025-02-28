import { EventEmitter } from "@allape/gocrud-react";

export default class SongPlayEventEmitter extends EventEmitter<
  "play" | "pause" | "stop"
> {}

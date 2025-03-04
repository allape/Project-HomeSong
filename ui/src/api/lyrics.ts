import Crudy, { config } from "@allape/gocrud-react";
import { ILyrics } from "../model/lyrics.ts";

export const LyricsCrudy = new Crudy<ILyrics>(`${config.SERVER_URL}/lyrics`);

import Crudy, { config } from "@allape/gocrud-react";
import { ISong, ISongArtist } from "../model/song.ts";

export const SongCrudy = new Crudy<ISong>(`${config.SERVER_URL}/song`);

export const SongArtistCrudy = new Crudy<ISongArtist>(
  `${config.SERVER_URL}/song/artist`,
);

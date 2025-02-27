import Crudy, { aapi, config } from "@allape/gocrud-react";
import { ISong, ISongArtist } from "../model/song.ts";

export const SongCrudy = new Crudy<ISong>(`${config.SERVER_URL}/song`);

export const SongArtistCrudy = new Crudy<ISongArtist>(
  `${config.SERVER_URL}/song/artist`,
);

export function upload(song: Partial<ISong>, file?: File): Promise<ISong> {
  const form = new FormData();
  form.append("song", JSON.stringify(song));
  if (file) {
    form.append("file", file);
  }
  return aapi.get(`${config.SERVER_URL}/song/upload`, {
    method: "PUT",
    body: form,
  });
}

export function saveSongArtists(
  songId: number,
  artistId: number[],
): Promise<ISongArtist[]> {
  return aapi.get(
    `${config.SERVER_URL}/song/artist/save/${songId}?artistIds=${encodeURIComponent(artistId.join(","))}`,
    {
      method: "PUT",
    },
  );
}

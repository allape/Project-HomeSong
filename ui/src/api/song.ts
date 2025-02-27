import Crudy, { aapi, config } from "@allape/gocrud-react";
import { ISong } from "../model/song.ts";

export const SongCrudy = new Crudy<ISong>(`${config.SERVER_URL}/song`);

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

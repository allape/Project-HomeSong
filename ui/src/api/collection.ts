import Crudy, { config, get } from "@allape/gocrud-react";
import { ICollection, ICollectionSong } from "../model/collection.ts";
import { ISong } from "../model/song.ts";

export const CollectionCrudy = new Crudy<ICollection>(
  `${config.SERVER_URL}/collection`,
);

export const CollectionSongCrudy = new Crudy<ICollectionSong>(
  `${config.SERVER_URL}/collection/song`,
);

export function saveCollectionSongsBySong(
  songId: ISong["id"],
  collectionIds: ICollection["id"][],
): Promise<ICollectionSong[]> {
  return get(
    `${config.SERVER_URL}/collection/song/save-by-song/${songId}?collectionIds=${encodeURIComponent(collectionIds.join(","))}`,
    {
      method: "PUT",
    },
  );
}

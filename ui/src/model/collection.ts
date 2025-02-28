import { IBase, IBaseSearchParams } from "@allape/gocrud";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ISong } from './song.ts';
import { IColoredLV } from "@allape/gocrud-react";

export type CollectionType = "artist" | "album" | "playlist";

export interface ICollection extends IBase {
  type: CollectionType;
  name: string;
  description: string;
  keywords: string;
  cover: string;
}

export interface ICollectionSearchParams extends IBaseSearchParams {
  in_id?: ICollection["id"][];
  in_type?: ICollection["type"][];
  keywords?: string;
}

export function useCollectionTypes(): IColoredLV<CollectionType>[] {
  const { t } = useTranslation();
  return useMemo<IColoredLV<CollectionType>[]>(
    () => [
      {
        label: t("collection.types.artist"),
        value: "artist",
        color: "green",
      },
      {
        label: t("collection.types.album"),
        value: "album",
        color: "orange",
      },
      {
        label: t("collection.types.playlist"),
        value: "playlist",
        color: "blue",
      },
    ],
    [t],
  );
}

export interface ICollectionSong extends Pick<IBase, "createdAt"> {
  songId: ISong["id"];
  collectionId: ICollection["id"];
}

export interface ICollectionSongSearchParams extends IBaseSearchParams {
  in_songId?: ISong["id"][];
  in_collectionId?: ICollection["id"][];
}


import { IBase, IBaseSearchParams } from "@allape/gocrud";
import { IColoredLV } from "@allape/gocrud-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ISong } from "./song.ts";

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
  orderBy_index?: 'desc' | 'asc';
  orderBy_createdAt?: 'desc' | 'asc';
  orderBy_updatedAt?: 'desc' | 'asc';
}

export function useCollectionTypes(): IColoredLV<CollectionType>[] {
  const { t } = useTranslation();
  return useMemo<IColoredLV<CollectionType>[]>(
    () =>
      CollectionTypes.map((ct) => ({
        ...ct,
        label: t(ct.label as string),
      })),
    [t],
  );
}

export const CollectionTypes: IColoredLV<CollectionType>[] = [
  {
    label: "collection.types.artist",
    value: "artist",
    color: "green",
  },
  {
    label: "collection.types.album",
    value: "album",
    color: "orange",
  },
  {
    label: "collection.types.playlist",
    value: "playlist",
    color: "blue",
  },
];

export interface ICollectionSong extends Pick<IBase, "createdAt"> {
  songId: ISong["id"];
  collectionId: ICollection["id"];
}

export interface ICollectionSongSearchParams extends IBaseSearchParams {
  in_songId?: ISong["id"][];
  in_collectionId?: ICollection["id"][];
}

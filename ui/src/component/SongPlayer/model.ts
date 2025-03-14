import { ISongWithCollections } from "../../api/song.ts";

export interface IModifiedSong extends ISongWithCollections {
  _url: string;
  _cover?: string;
  _name: string;
}

import { IBase, IBaseSearchParams } from "@allape/gocrud";

export interface IArtist extends IBase {
  name: string;
  nameRoman: string;
  portrait: string;
}

export interface IArtistSearchParams extends IBaseSearchParams {
  in_id?: IArtist["id"][];
  keyword?: string;
}

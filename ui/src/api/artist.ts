import Crudy, { config } from "@allape/gocrud-react";
import { IArtist } from "../model/artist.ts";

export const ArtistCrudy = new Crudy<IArtist>(`${config.SERVER_URL}/artist`);

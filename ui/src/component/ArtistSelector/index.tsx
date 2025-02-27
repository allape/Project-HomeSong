import { BaseSearchParams } from "@allape/gocrud";
import { CrudySelector } from "@allape/gocrud-react";
import { ICrudySelectorProps } from "@allape/gocrud-react/src/component/CrudySelector";
import { PropsWithChildren, ReactElement } from 'react';
import { useTranslation } from "react-i18next";
import { ArtistCrudy } from "../../api/artist.ts";
import { IArtist } from "../../model/artist.ts";

export type IArtistSelectorProps = Partial<ICrudySelectorProps<IArtist>>;

export default function ArtistSelector(
  props: PropsWithChildren<IArtistSelectorProps>,
): ReactElement {
  const { t } = useTranslation();
  return (
    <CrudySelector<IArtist>
      placeholder={`${t("select")} ${t("artist._")}`}
      {...props}
      crudy={ArtistCrudy}
      pageSize={10}
      searchParams={BaseSearchParams}
      searchPropName="keyword"
    />
  );
}

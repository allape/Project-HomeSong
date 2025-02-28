import { BaseSearchParams } from "@allape/gocrud";
import { CrudySelector } from "@allape/gocrud-react";
import { ICrudySelectorProps } from "@allape/gocrud-react/src/component/CrudySelector";
import { PropsWithChildren, ReactElement, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { CollectionCrudy } from "../../api/collection.ts";
import {
  ICollection,
  ICollectionSearchParams,
} from "../../model/collection.ts";

export type ICollectionSelectorProps = Partial<
  ICrudySelectorProps<ICollection>
>;

export default function CollectionSelector(
  props: PropsWithChildren<ICollectionSelectorProps>,
): ReactElement {
  const { t } = useTranslation();

  const sp = useMemo<ICollectionSearchParams>(
    () => ({
      ...BaseSearchParams,
      orderBy_updatedAt: "desc",
      orderBy_index: "desc",
    }),
    [],
  );

  return (
    <CrudySelector<ICollection, ICollectionSearchParams>
      placeholder={`${t("select")} ${t("collection._")}`}
      {...props}
      crudy={CollectionCrudy}
      pageSize={1000}
      searchParams={sp}
      searchPropName="keywords"
    />
  );
}

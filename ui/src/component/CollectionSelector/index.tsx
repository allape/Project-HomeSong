import { BaseSearchParams } from "@allape/gocrud";
import { CrudySelector, ILV } from "@allape/gocrud-react";
import { ICrudySelectorProps } from "@allape/gocrud-react/src/component/CrudySelector";
import { PropsWithChildren, ReactElement, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { CollectionCrudy } from "../../api/collection.ts";
import {
  CollectionTypes,
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

  const handleBuild = useCallback(
    (records: ICollection[]) => {
      const groups: ILV<ICollection["type"]>[] = CollectionTypes.map((i) => ({
        ...i,
      }));
      groups.forEach((g) => {
        g.label = t(g.label as string);
        g.options = records
          .filter((r) => r.type === g.value)
          .map((r) => ({
            label: `${r.id}: ${r.name}`,
            value: r.id,
          }));
      });
      return groups as unknown as ILV<ICollection["id"]>[];
    },
    [t],
  );

  const sp = useMemo<ICollectionSearchParams>(
    () => ({
      ...BaseSearchParams,
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
      buildLV={handleBuild}
    />
  );
}

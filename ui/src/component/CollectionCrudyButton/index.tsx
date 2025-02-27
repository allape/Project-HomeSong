import { BaseSearchParams } from "@allape/gocrud";
import {
  asDefaultPattern,
  config,
  CrudyButton,
  searchable,
  Uploader,
} from "@allape/gocrud-react";
import { ICrudyButtonProps } from "@allape/gocrud-react/src/component/CrudyButton";
import { PictureOutlined, UserOutlined } from "@ant-design/icons";
import { Avatar, Form, Input, Select, TableColumnsType, Tag } from "antd";
import { ReactElement, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { EllipsisCell } from "../../../../../gocrud-react/src/helper/antd.tsx";
import { CollectionCrudy } from "../../api/collection.ts";
import {
  ICollection,
  ICollectionSearchParams,
  useCollectionTypes,
} from "../../model/collection.ts";

type IRecord = ICollection;
type ISearchParams = ICollectionSearchParams;

export type ICollectionCrudyButtonProps = Partial<ICrudyButtonProps<IRecord>>;

export default function ICollectionCrudyButton(
  props: ICollectionCrudyButtonProps,
): ReactElement {
  const { t } = useTranslation();

  const types = useCollectionTypes();

  const [searchParams, setSearchParams] = useState<ISearchParams>(() => ({
    ...BaseSearchParams,
  }));

  const columns = useMemo<TableColumnsType<IRecord>>(
    () => [
      {
        title: t("id"),
        dataIndex: "id",
      },
      {
        title: t("collection.type"),
        dataIndex: "type",
        render: (v) => {
          const found = types.find((t) => t.value === v);
          return <Tag color={found?.color}>{found?.label || t("unknown")}</Tag>;
        },
      },
      {
        title: t("collection.cover"),
        dataIndex: "cover",
        width: 100,
        align: "center",
        render: (v, record) =>
          v ? (
            <Avatar size={64} src={`${config.SERVER_STATIC_URL}${v}`} />
          ) : (
            <Avatar
              size={64}
              icon={
                record.type === "artist" ? (
                  <UserOutlined />
                ) : (
                  <PictureOutlined />
                )
              }
            />
          ),
      },
      {
        title: t("collection.name"),
        dataIndex: "name",
        render: (v, r) => (
          <div>
            <div>{v}</div>
            <div>{r.keywords}</div>
          </div>
        ),
        filtered: !!searchParams["keywords"],
        ...searchable(t("collection.keywords"), (value) =>
          setSearchParams((old) => ({
            ...old,
            keywords: value,
          })),
        ),
      },
      {
        title: t("collection.description"),
        dataIndex: "description",
        render: (v) => EllipsisCell()(v),
      },
      {
        title: t("createdAt"),
        dataIndex: "createdAt",
        render: asDefaultPattern,
      },
      {
        title: t("updatedAt"),
        dataIndex: "updatedAt",
        render: asDefaultPattern,
      },
    ],
    [searchParams, t, types],
  );

  return (
    <CrudyButton
      name={t("collection._")}
      columns={columns}
      crudy={CollectionCrudy}
      searchParams={searchParams}
      {...props}
    >
      <Form.Item name="cover" label={t("collection.cover")}>
        <Uploader serverURL={config.SERVER_STATIC_URL} />
      </Form.Item>
      <Form.Item
        name="type"
        label={t("collection.type")}
        rules={[{ required: true }]}
      >
        <Select placeholder={t("collection.type")} options={types} />
      </Form.Item>
      <Form.Item
        name="name"
        label={t("collection.name")}
        rules={[{ required: true }]}
      >
        <Input maxLength={200} placeholder={t("collection.name")} />
      </Form.Item>
      <Form.Item name="keywords" label={t("collection.keywords")}>
        <Input maxLength={200} placeholder={t("collection.keywords")} />
      </Form.Item>
      <Form.Item name="description" label={t("collection.description")}>
        <Input.TextArea
          maxLength={20000}
          placeholder={t("collection.description")}
        />
      </Form.Item>
    </CrudyButton>
  );
}

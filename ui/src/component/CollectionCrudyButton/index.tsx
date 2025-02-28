import { BaseSearchParams } from "@allape/gocrud";
import {
  asDefaultPattern,
  config,
  CrudyButton,
  Ellipsis,
  searchable,
  Uploader,
} from "@allape/gocrud-react";
import { ICrudyButtonProps } from "@allape/gocrud-react/src/component/CrudyButton";
import { PictureOutlined, UserOutlined } from "@ant-design/icons";
import {
  Avatar,
  Form,
  Input,
  InputNumber,
  Select,
  TableColumnsType,
  Tag,
} from "antd";
import { ReactElement, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CollectionCrudy } from "../../api/collection.ts";
import {
  ICollection,
  ICollectionSearchParams,
  useCollectionTypes,
} from "../../model/collection.ts";

type IRecord = ICollection;
type ISearchParams = ICollectionSearchParams;

export type ICollectionCrudyButtonProps = Partial<ICrudyButtonProps<IRecord>>;

export default function CollectionCrudyButton(
  props: ICollectionCrudyButtonProps,
): ReactElement {
  const { t } = useTranslation();

  const types = useCollectionTypes();

  const [searchParams, setSearchParams] = useState<ISearchParams>(() => ({
    ...BaseSearchParams,
    orderBy_updatedAt: "desc",
  }));

  const columns = useMemo<TableColumnsType<IRecord>>(
    () => [
      {
        title: t("id"),
        dataIndex: "id",
      },
      {
        title: t("collection.index"),
        dataIndex: "index",
      },
      {
        title: t("collection.type"),
        dataIndex: "type",
        render: (v) => {
          const found = types.find((t) => t.value === v);
          return <Tag color={found?.color}>{found?.label || t("unknown")}</Tag>;
        },
        filtered: !!searchParams["in_type"],
        ...searchable<IRecord, IRecord["type"]>(
          t("collection.type"),
          (value) =>
            setSearchParams((old) => ({
              ...old,
              in_type: value ? [value] : undefined,
            })),
          (value, onChange) => (
            <Select
              options={types}
              value={value}
              onChange={onChange}
              placeholder={t("collection.type")}
            />
          ),
        ),
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
        render: (v) => <Ellipsis>{v}</Ellipsis>,
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
      <Form.Item name="index" label={t("collection.index")}>
        <InputNumber
          min={-9999}
          max={9999}
          step={1}
          precision={0}
          placeholder={t("collection.index")}
        />
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
          rows={10}
          placeholder={t("collection.description")}
        />
      </Form.Item>
    </CrudyButton>
  );
}

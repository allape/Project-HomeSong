import { i18n } from "@allape/gocrud-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.scss";
import App from "./App.tsx";

i18n
  .setup({
    zh: {
      translation: {
        ...i18n.ZHCN,

        id: "ID",
        unknown: "未知",
        select: "选择",
        createdAt: "创建时间",
        updatedAt: "更新时间",

        song: {
          _: "歌曲",
          name: "歌曲名称",
          cover: "封面",
          ffprobeInfo: "FFProbe 信息",
          mime: "MIME",
          description: "描述",
          index: "序号",
        },
        collection: {
          _: "收藏",
          name: "名称",
          type: "类型",
          description: "描述",
          keywords: "关键词",
          cover: "封面",
          index: "序号",
          types: {
            artist: "艺术家",
            album: "专辑",
            playlist: "歌单",
          },
        },
        player: {
          name: "播放器",
        },
      },
    },
    en: {
      translation: {
        ...i18n.EN,

        id: "ID",
        unknown: "Unknown",
        select: "Select",
        createdAt: "Created At",
        updatedAt: "Updated At",

        song: {
          _: "Song",
          name: "Name",
          cover: "Cover",
          ffprobeInfo: "FFProbe Info",
          mime: "MIME",
          description: "Description",
          index: "Index",
        },
        collection: {
          _: "Collection",
          name: "Name",
          type: "Type",
          description: "Description",
          keywords: "Keywords",
          cover: "Cover",
          index: "Index",
          types: {
            artist: "Artist",
            album: "Album",
            playlist: "Playlist",
          },
        },
        player: {
          name: "Music Player",
        },
      },
    },
  })
  .then(() => {
    createRoot(document.getElementById("root")!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  });

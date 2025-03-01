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
        download: "下载",
        createdAt: "创建时间",
        updatedAt: "更新时间",
        continuesUpload: "持续性上传",
        keepCover: "保留封面",

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
          close: "关闭",
          expand: "展开",
          collapse: "收起",
          move: "移动",
          play: "播放",
          pause: "暂停",
          shuffle: "随机播放",
          prev: "上一首",
          next: "下一首",
        },
      },
    },
    en: {
      translation: {
        ...i18n.EN,

        id: "ID",
        unknown: "Unknown",
        select: "Select",
        download: "Download",
        createdAt: "Created At",
        updatedAt: "Updated At",
        continuesUpload: "Continues Upload",
        keepCover: "Keep Cover",

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
          close: "Close",
          expand: "Expand",
          collapse: "Collapse",
          move: "Move",
          play: "Play",
          pause: "Pause",
          shuffle: "Shuffle",
          prev: "Previous",
          next: "Next",
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

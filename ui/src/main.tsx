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
        copied: "已复制",
        created: "已创建",
        createArtistsFast: "快速创建艺术家",

        song: {
          _: "歌曲",
          name: "歌曲名称",
          cover: "封面",
          ffprobeInfo: "FFProbe 信息",
          mime: "MIME",
          description: "描述",
          index: "序号",
          artistName: "艺术家名称",
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
        lyrics: {
          _: "歌词",
          name: "名称",
          content: ".lrcp",
          index: "序号",
          offset: "偏移",
          description: "描述",
          fromStandardLRC: "从标准 LRC 解析",
        },
        player: {
          name: "播放器",
          close: "关闭",
          expand: "展开",
          collapse: "收起",
          move: "移动",
          play: "播放",
          pause: "暂停",
          prev: "上一首",
          next: "下一首",
          list: "列表",
          lyrics: "歌词",
          loadingLyrics: "加载歌词中",
          noLyrics: "暂无歌词",
          loopType: {
            shuffle: "随机播放",
            list: "列表循环",
            no: "单曲播放",
          },
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
        copied: "Copied",
        created: "Created",
        createArtistsFast: "Create Artists",

        song: {
          _: "Song",
          name: "Name",
          cover: "Cover",
          ffprobeInfo: "FFProbe Info",
          mime: "MIME",
          description: "Description",
          index: "Index",
          artistName: "Artist Name",
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
        lyrics: {
          _: "Lyrics",
          name: "Name",
          content: ".lrcp",
          index: "Index",
          offset: "Offset",
          description: "Description",
          fromStandardLRC: "Parse from Standard LRC",
        },
        player: {
          name: "Music Player",
          close: "Close",
          expand: "Expand",
          collapse: "Collapse",
          move: "Move",
          play: "Play",
          pause: "Pause",
          prev: "Previous",
          next: "Next",
          list: "List",
          lyrics: "Lyrics",
          loadingLyrics: "Loading Lyrics",
          noLyrics: "No Lyrics",
          loopType: {
            shuffle: "Shuffle",
            list: "List Loop",
            no: "No Loop",
          },
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

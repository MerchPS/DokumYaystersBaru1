"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const API_URL =
  "https://script.google.com/macros/s/AKfycby7p6uJv9MlKn8-Glo_6J36bKQmz5lgf7WKlive8CnSGL7PiO-A5va5VZ-882seYVCb/exec";

const CACHE_KEY = "yaysters_media_cache_v5";
const CACHE_TIME_KEY = "yaysters_media_cache_time_v5";
const CACHE_EXPIRE_TIME = 1000 * 60 * 60 * 24;

type MediaItem = {
  id: string;
  name: string;
  folder?: string;
  mimeType?: string;
  viewUrl?: string;
  previewUrl?: string;
  downloadUrl?: string;
  imageUrl?: string;
  url?: string;
  size?: number;
};

type MediaData = {
  photos: MediaItem[];
  videos: MediaItem[];
  audios: MediaItem[];
};

type TabKey = "folders" | "photos" | "videos" | "audios";

function getSafeMedia(data: Partial<MediaData> | null): MediaData {
  return {
    photos: Array.isArray(data?.photos) ? data.photos : [],
    videos: Array.isArray(data?.videos) ? data.videos : [],
    audios: Array.isArray(data?.audios) ? data.audios : [],
  };
}

function formatBytes(bytes?: number) {
  if (!bytes || Number.isNaN(Number(bytes))) return "";

  const sizes = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(Number(bytes)) / Math.log(1024)),
    sizes.length - 1
  );

  return `${(Number(bytes) / Math.pow(1024, index)).toFixed(1)} ${
    sizes[index]
  }`;
}

function getPhotoUrl(item: MediaItem) {
  return (
    item.imageUrl ||
    `https://drive.google.com/thumbnail?id=${item.id}&sz=w2000`
  );
}

function getVideoPreviewUrl(item: MediaItem) {
  return item.previewUrl || `https://drive.google.com/file/d/${item.id}/preview`;
}

function getViewUrl(item: MediaItem) {
  return item.viewUrl || `https://drive.google.com/file/d/${item.id}/view`;
}

function groupPhotosByFolder(photos: MediaItem[]) {
  const map = new Map<string, MediaItem[]>();

  photos.forEach((item) => {
    const folderName = item.folder || "Tanpa Folder";
    const currentItems = map.get(folderName) || [];
    currentItems.push(item);
    map.set(folderName, currentItems);
  });

  return Array.from(map.entries()).map(([folder, items]) => ({
    folder,
    items,
    cover: items[0],
    count: items.length,
  }));
}

function PhotoCard({ item }: { item: MediaItem }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <a
      href={getViewUrl(item)}
      target="_blank"
      rel="noopener noreferrer"
      className="group block overflow-hidden rounded-[26px] border border-white/10 bg-[#121620] shadow-[0_20px_80px_rgba(0,0,0,0.25)] transition duration-300 hover:-translate-y-1 hover:border-white/25"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[#0b0f17]">
        {!loaded && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-white/10 via-white/[0.04] to-transparent" />
        )}

        <img
          src={getPhotoUrl(item)}
          alt={item.name}
          loading="lazy"
          decoding="async"
          draggable={false}
          onLoad={() => setLoaded(true)}
          className={`h-full w-full select-none object-cover transition duration-500 group-hover:scale-[1.035] ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent p-4">
          <p className="truncate text-sm font-semibold text-white">
            {item.name}
          </p>

          <div className="mt-1 flex items-center justify-between gap-3">
            <p className="truncate text-xs text-white/55">
              {item.folder || "Yaysters"}
            </p>

            {item.size && (
              <p className="shrink-0 text-xs text-white/45">
                {formatBytes(item.size)}
              </p>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}

function FolderCard({
  folder,
  count,
  cover,
  onOpen,
}: {
  folder: string;
  count: number;
  cover: MediaItem;
  onOpen: () => void;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group overflow-hidden rounded-[30px] border border-white/10 bg-[#121620] text-left shadow-[0_20px_80px_rgba(0,0,0,0.25)] transition duration-300 hover:-translate-y-1 hover:border-white/25"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#0b0f17]">
        {!loaded && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-white/10 via-white/[0.04] to-transparent" />
        )}

        <img
          src={getPhotoUrl(cover)}
          alt={folder}
          loading="lazy"
          decoding="async"
          draggable={false}
          onLoad={() => setLoaded(true)}
          className={`h-full w-full select-none object-cover transition duration-500 group-hover:scale-[1.035] ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-white/45">
            Album
          </p>

          <h3 className="mt-2 line-clamp-2 text-xl font-black text-white">
            {folder}
          </h3>

          <p className="mt-2 text-sm font-medium text-white/55">
            {count} foto dokumentasi
          </p>
        </div>
      </div>
    </button>
  );
}

function VideoCard({ item }: { item: MediaItem }) {
  return (
    <article className="overflow-hidden rounded-[26px] border border-white/10 bg-[#121620] shadow-[0_20px_80px_rgba(0,0,0,0.25)]">
      <iframe
        src={getVideoPreviewUrl(item)}
        title={item.name}
        loading="lazy"
        allow="autoplay"
        allowFullScreen
        className="aspect-video w-full border-0 bg-black"
      />

      <div className="p-5">
        <p className="truncate text-sm font-bold text-white">{item.name}</p>

        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="truncate text-xs text-white/45">
            {item.folder || "Yaysters Video"}
          </p>

          {item.size && (
            <p className="shrink-0 text-xs text-white/45">
              {formatBytes(item.size)}
            </p>
          )}
        </div>

        <a
          href={getViewUrl(item)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-white/65 transition hover:border-white/25 hover:text-white"
        >
          Buka di Drive
        </a>
      </div>
    </article>
  );
}

function AudioCard({ item }: { item: MediaItem }) {
  return (
    <article className="rounded-[26px] border border-white/10 bg-[#121620] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.25)]">
      <p className="truncate text-sm font-bold text-white">{item.name}</p>

      <div className="mt-2 mb-4 flex items-center justify-between gap-3">
        <p className="truncate text-xs text-white/45">
          {item.folder || "Yaysters Audio"}
        </p>

        {item.size && (
          <p className="shrink-0 text-xs text-white/45">
            {formatBytes(item.size)}
          </p>
        )}
      </div>

      <audio
        src={item.downloadUrl || item.url}
        controls
        preload="none"
        className="w-full"
      />
    </article>
  );
}

export default function Home() {
  const [media, setMedia] = useState<MediaData>({
    photos: [],
    videos: [],
    audios: [],
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("folders");
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const folders = useMemo(() => groupPhotosByFolder(media.photos), [media.photos]);

  const loadFromCache = useCallback(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);

      if (!cached) return false;

      const parsed = JSON.parse(cached);
      const safeMedia = getSafeMedia(parsed);

      setMedia(safeMedia);
      setLoading(false);

      return true;
    } catch {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_TIME_KEY);
      return false;
    }
  }, []);

  const saveToCache = useCallback((data: MediaData) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
    } catch {}
  }, []);

  const fetchFreshData = useCallback(
    async (silent = false) => {
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await fetch(`${API_URL}?t=${Date.now()}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Gagal mengambil data dari Apps Script");
        }

        const data = await response.json();
        const safeMedia = getSafeMedia(data);

        setMedia(safeMedia);
        saveToCache(safeMedia);
      } catch (error) {
        console.error("Gagal load media:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [saveToCache]
  );

  useEffect(() => {
    const hasCache = loadFromCache();
    const cachedTime = Number(localStorage.getItem(CACHE_TIME_KEY) || 0);
    const cacheStillFresh = Date.now() - cachedTime < CACHE_EXPIRE_TIME;

    if (!hasCache) {
      fetchFreshData(false);
      return;
    }

    if (!cacheStillFresh) {
      fetchFreshData(true);
    }
  }, [fetchFreshData, loadFromCache]);

  const visiblePhotos = useMemo(() => {
    const baseItems = activeFolder
      ? media.photos.filter((item) => (item.folder || "Tanpa Folder") === activeFolder)
      : media.photos;

    return baseItems.filter((item) => {
      const keyword = `${item.name || ""} ${item.folder || ""}`.toLowerCase();
      return keyword.includes(search.toLowerCase());
    });
  }, [activeFolder, media.photos, search]);

  const visibleVideos = useMemo(() => {
    return media.videos.filter((item) => {
      const keyword = `${item.name || ""} ${item.folder || ""}`.toLowerCase();
      return keyword.includes(search.toLowerCase());
    });
  }, [media.videos, search]);

  const visibleAudios = useMemo(() => {
    return media.audios.filter((item) => {
      const keyword = `${item.name || ""} ${item.folder || ""}`.toLowerCase();
      return keyword.includes(search.toLowerCase());
    });
  }, [media.audios, search]);

  const visibleFolders = useMemo(() => {
    return folders.filter((item) =>
      item.folder.toLowerCase().includes(search.toLowerCase())
    );
  }, [folders, search]);

  const tabs = [
    {
      key: "folders" as TabKey,
      label: "Album",
      count: folders.length,
    },
    {
      key: "photos" as TabKey,
      label: "Foto",
      count: media.photos.length,
    },
    {
      key: "videos" as TabKey,
      label: "Video",
      count: media.videos.length,
    },
    {
      key: "audios" as TabKey,
      label: "Audio",
      count: media.audios.length,
    },
  ];

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#07090f] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-10%] top-[-15%] h-[420px] w-[420px] rounded-full bg-pink-500/10 blur-[120px]" />
        <div className="absolute right-[-10%] top-[20%] h-[420px] w-[420px] rounded-full bg-purple-500/10 blur-[120px]" />
      </div>

      <section className="relative mx-auto max-w-7xl px-5 py-7 md:py-10">
        <header className="mb-7 overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.045] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-10">
          <nav className="mb-16 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black tracking-[0.42em] text-white">
                YAYSTERS
              </p>
              <p className="mt-1 text-xs font-medium text-white/40">
                Community Archive
              </p>
            </div>

            <div className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-bold text-white/55">
              Built by Hans
            </div>
          </nav>

          <div className="max-w-4xl">
            <p className="mb-4 inline-flex rounded-full border border-pink-300/20 bg-pink-300/10 px-4 py-2 text-xs font-bold text-pink-100">
              Yaysters Community Gallery
            </p>

            <h1 className="text-5xl font-black leading-[0.95] tracking-tight md:text-8xl">
              Moments.
              <br />
              Memories.
              <br />
              Yaysters.
            </h1>

            <p className="mt-6 max-w-2xl text-sm leading-7 text-white/55 md:text-base">
              Tempat dokumentasi foto, video, dan audio komunitas Yaysters yang
              tersusun rapi dari Google Drive.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-3 md:max-w-xl">
            <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
              <p className="text-2xl font-black">{media.photos.length}</p>
              <p className="mt-1 text-xs font-medium text-white/40">Foto</p>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
              <p className="text-2xl font-black">{media.videos.length}</p>
              <p className="mt-1 text-xs font-medium text-white/40">Video</p>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
              <p className="text-2xl font-black">{folders.length}</p>
              <p className="mt-1 text-xs font-medium text-white/40">Album</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => fetchFreshData(true)}
              disabled={refreshing}
              className="rounded-full bg-white px-5 py-3 text-sm font-black text-black transition hover:bg-pink-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshing ? "Refreshing..." : "Refresh Gallery"}
            </button>

            <p className="text-xs text-white/35">
              Cache aktif 24 jam untuk list file. Gambar pakai browser cache
              agar scroll lebih ringan.
            </p>
          </div>
        </header>

        <div className="sticky top-3 z-30 mb-7 rounded-[26px] border border-white/10 bg-[#0d1119]/90 p-3 backdrop-blur-xl">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.key);

                    if (tab.key !== "photos") {
                      setActiveFolder(null);
                    }
                  }}
                  className={`shrink-0 rounded-full px-5 py-3 text-sm font-black transition ${
                    activeTab === tab.key
                      ? "bg-white text-black"
                      : "bg-white/[0.06] text-white/50 hover:bg-white/[0.10] hover:text-white"
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari album, foto, video..."
              className="w-full rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-medium text-white outline-none placeholder:text-white/30 focus:border-pink-200/40 lg:w-96"
            />
          </div>
        </div>

        {activeFolder && activeTab === "photos" && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/35">
                Album Dibuka
              </p>
              <h2 className="mt-1 text-xl font-black">{activeFolder}</h2>
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveFolder(null);
                setActiveTab("folders");
              }}
              className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-white/60 transition hover:border-white/25 hover:text-white"
            >
              Kembali ke Album
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 12 }).map((_, index) => (
              <div
                key={index}
                className="aspect-[4/5] animate-pulse rounded-[28px] bg-white/[0.06]"
              />
            ))}
          </div>
        ) : (
          <>
            {activeTab === "folders" && (
              <>
                {visibleFolders.length === 0 ? (
                  <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-12 text-center text-white/50">
                    Album tidak ditemukan.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {visibleFolders.map((folder) => (
                      <FolderCard
                        key={folder.folder}
                        folder={folder.folder}
                        count={folder.count}
                        cover={folder.cover}
                        onOpen={() => {
                          setActiveFolder(folder.folder);
                          setActiveTab("photos");
                          window.scrollTo({
                            top: 0,
                            behavior: "smooth",
                          });
                        }}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === "photos" && (
              <>
                {visiblePhotos.length === 0 ? (
                  <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-12 text-center text-white/50">
                    Foto tidak ditemukan.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {visiblePhotos.map((item) => (
                      <PhotoCard key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === "videos" && (
              <>
                {visibleVideos.length === 0 ? (
                  <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-12 text-center text-white/50">
                    Video tidak ditemukan.
                  </div>
                ) : (
                  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {visibleVideos.map((item) => (
                      <VideoCard key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === "audios" && (
              <>
                {visibleAudios.length === 0 ? (
                  <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-12 text-center text-white/50">
                    Audio tidak ditemukan.
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {visibleAudios.map((item) => (
                      <AudioCard key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        <footer className="mt-14 border-t border-white/10 py-8 text-center">
          <p className="text-sm font-black tracking-[0.35em] text-white/70">
            YAYSTERS
          </p>
          <p className="mt-2 text-xs text-white/35">
            Community archive website • Built by Hans
          </p>
        </footer>
      </section>
    </main>
  );
}

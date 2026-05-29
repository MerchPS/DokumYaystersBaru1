"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const API_URL =
  "https://script.google.com/macros/s/AKfycby7p6uJv9MlKn8-Glo_6J36bKQmz5lgf7WKlive8CnSGL7PiO-A5va5VZ-882seYVCb/exec";

const CACHE_KEY = "yaysters_gallery_media_cache_v2";
const CACHE_TIME_KEY = "yaysters_gallery_media_cache_time_v2";
const LOADED_PREVIEW_KEY = "yaysters_gallery_loaded_preview_ids_v2";
const CACHE_EXPIRE_TIME = 1000 * 60 * 30;

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

function getSafeMedia(data: Partial<MediaData> | null): MediaData {
  return {
    photos: Array.isArray(data?.photos) ? data.photos : [],
    videos: Array.isArray(data?.videos) ? data.videos : [],
    audios: Array.isArray(data?.audios) ? data.audios : [],
  };
}

function getLoadedPreviewIds() {
  try {
    const raw = localStorage.getItem(LOADED_PREVIEW_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set<string>(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set<string>();
  }
}

function saveLoadedPreviewId(id: string) {
  try {
    const ids = getLoadedPreviewIds();
    ids.add(id);
    localStorage.setItem(LOADED_PREVIEW_KEY, JSON.stringify(Array.from(ids)));
  } catch {}
}

function useInViewOnce(rootMargin = "900px") {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    if (ref.current) observer.observe(ref.current);

    return () => observer.disconnect();
  }, [rootMargin, visible]);

  return { ref, visible };
}

function DrivePreview({
  item,
  ratio,
}: {
  item: MediaItem;
  ratio: "photo" | "video";
}) {
  const { ref, visible } = useInViewOnce("1000px");
  const [loaded, setLoaded] = useState(false);
  const [alreadyLoaded, setAlreadyLoaded] = useState(false);

  useEffect(() => {
    const ids = getLoadedPreviewIds();
    if (ids.has(item.id)) {
      setAlreadyLoaded(true);
      setLoaded(true);
    }
  }, [item.id]);

  const previewUrl =
    item.previewUrl || `https://drive.google.com/file/d/${item.id}/preview`;

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden bg-[#0d1119] ${
        ratio === "photo" ? "aspect-[4/5]" : "aspect-video"
      }`}
    >
      {!loaded && !alreadyLoaded && (
        <div className="absolute inset-0 z-10 animate-pulse bg-gradient-to-br from-white/[0.10] via-white/[0.04] to-transparent" />
      )}

      {visible && (
        <iframe
          src={previewUrl}
          title={item.name}
          loading="lazy"
          allow="autoplay"
          allowFullScreen
          suppressHydrationWarning
          onLoad={() => {
            setLoaded(true);
            setAlreadyLoaded(true);
            saveLoadedPreviewId(item.id);
          }}
          className={`h-full w-full border-0 transition duration-300 ${
            loaded || alreadyLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {!visible && (
        <div className="flex h-full w-full items-center justify-center text-sm text-white/35">
          Menunggu tampil...
        </div>
      )}
    </div>
  );
}

function PhotoCard({ item }: { item: MediaItem }) {
  const viewUrl =
    item.viewUrl || `https://drive.google.com/file/d/${item.id}/view`;

  return (
    <article className="group overflow-hidden rounded-[24px] border border-white/10 bg-[#141922] transition duration-300 hover:-translate-y-1 hover:border-pink-300/30">
      <div className="relative">
        <DrivePreview item={item} ratio="photo" />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent p-4">
          <p className="truncate text-sm font-bold text-white">{item.name}</p>

          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="truncate text-xs font-semibold text-pink-200">
              {item.folder || "Drive"}
            </p>

            {item.size && (
              <p className="shrink-0 text-xs text-white/55">
                {formatBytes(item.size)}
              </p>
            )}
          </div>
        </div>
      </div>

      <a
        href={viewUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block px-4 py-3 text-xs font-semibold text-white/50 transition hover:text-pink-200"
      >
        Buka di Google Drive
      </a>
    </article>
  );
}

function VideoCard({ item }: { item: MediaItem }) {
  const viewUrl =
    item.viewUrl || `https://drive.google.com/file/d/${item.id}/view`;

  return (
    <article className="overflow-hidden rounded-[24px] border border-white/10 bg-[#141922] transition duration-300 hover:-translate-y-1 hover:border-pink-300/30">
      <DrivePreview item={item} ratio="video" />

      <div className="p-4">
        <p className="truncate text-sm font-bold text-white">{item.name}</p>

        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="truncate text-xs font-semibold text-pink-200">
            {item.folder || "Drive"}
          </p>

          {item.size && (
            <p className="shrink-0 text-xs text-white/55">
              {formatBytes(item.size)}
            </p>
          )}
        </div>

        <a
          href={viewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block text-xs font-semibold text-white/50 transition hover:text-pink-200"
        >
          Buka di Google Drive
        </a>
      </div>
    </article>
  );
}

function AudioCard({ item }: { item: MediaItem }) {
  return (
    <article className="rounded-[24px] border border-white/10 bg-[#141922] p-5">
      <p className="truncate text-sm font-bold text-white">{item.name}</p>

      <div className="mt-1 mb-4 flex items-center justify-between gap-2">
        <p className="truncate text-xs font-semibold text-pink-200">
          {item.folder || "Drive"}
        </p>

        {item.size && (
          <p className="shrink-0 text-xs text-white/55">
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
  const [activeTab, setActiveTab] = useState<keyof MediaData>("photos");
  const [search, setSearch] = useState("");

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

  const filteredItems = useMemo(() => {
    const items = media[activeTab] || [];

    return items.filter((item) => {
      const name = item.name || "";
      const folder = item.folder || "";

      return `${name} ${folder}`.toLowerCase().includes(search.toLowerCase());
    });
  }, [media, activeTab, search]);

  const tabs: {
    key: keyof MediaData;
    label: string;
    count: number;
  }[] = [
    {
      key: "photos",
      label: "Foto",
      count: media.photos.length,
    },
    {
      key: "videos",
      label: "Video",
      count: media.videos.length,
    },
    {
      key: "audios",
      label: "Audio",
      count: media.audios.length,
    },
  ];

  return (
    <main className="min-h-screen bg-[#080c13] text-white">
      <section className="mx-auto max-w-7xl px-5 py-8 md:py-12">
        <header className="mb-8 rounded-[28px] border border-white/10 bg-[#141922] p-7 md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-3 text-sm font-bold text-pink-300">
                Yaysters Gallery
              </p>

              <h1 className="text-4xl font-black tracking-tight md:text-6xl">
                Dokumentasi Mabar
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-6 text-white/55 md:text-base">
                Arsip foto, video, dan audio dari Google Drive.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-white/[0.06] px-4 py-3">
                <p className="text-xl font-black">{media.photos.length}</p>
                <p className="text-xs text-white/45">Foto</p>
              </div>

              <div className="rounded-2xl bg-white/[0.06] px-4 py-3">
                <p className="text-xl font-black">{media.videos.length}</p>
                <p className="text-xs text-white/45">Video</p>
              </div>

              <div className="rounded-2xl bg-white/[0.06] px-4 py-3">
                <p className="text-xl font-black">{media.audios.length}</p>
                <p className="text-xs text-white/45">Audio</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              suppressHydrationWarning
              onClick={() => fetchFreshData(true)}
              disabled={refreshing}
              className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-pink-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshing ? "Refresh..." : "Refresh Gallery"}
            </button>

            <p className="text-xs text-white/40">
              Cache aktif untuk list file dan status preview yang sudah pernah
              dimuat.
            </p>
          </div>
        </header>

        <div className="sticky top-4 z-20 mb-7 rounded-[24px] border border-white/10 bg-[#111722]/90 p-3 backdrop-blur-xl">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-2 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  suppressHydrationWarning
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`shrink-0 rounded-2xl px-5 py-3 text-sm font-bold transition ${
                    activeTab === tab.key
                      ? "bg-white text-black"
                      : "text-white/55 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            <input
              suppressHydrationWarning
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama file / folder..."
              className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-pink-300/50 lg:w-96"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 12 }).map((_, index) => (
              <div
                key={index}
                className="aspect-[4/5] animate-pulse rounded-[24px] bg-white/[0.06]"
              />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-[26px] border border-white/10 bg-[#141922] p-12 text-center">
            <p className="text-white/60">File belum ada atau tidak ditemukan.</p>
          </div>
        ) : (
          <>
            {activeTab === "photos" && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {filteredItems.map((item) => (
                  <PhotoCard key={item.id} item={item} />
                ))}
              </div>
            )}

            {activeTab === "videos" && (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {filteredItems.map((item) => (
                  <VideoCard key={item.id} item={item} />
                ))}
              </div>
            )}

            {activeTab === "audios" && (
              <div className="grid gap-4">
                {filteredItems.map((item) => (
                  <AudioCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
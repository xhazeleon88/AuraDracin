export type UserRole = "user" | "admin";

export type CategorySlug =
  | "romance"
  | "balas-dendam"
  | "ceo"
  | "fantasi"
  | "komedi"
  | "keluarga"
  | "aksi"
  | "misteri";

export type DramaCard = {
  id: string;
  provider: string;
  title: string;
  cover: string;
  synopsis?: string;
  episodeCount?: number;
  category?: CategorySlug | string;
  likes?: number;
  isNew?: boolean;
  source: "dramabos" | "local";
  slug?: string;
};

export type DramaDetail = DramaCard & {
  episodes: DramaEpisode[];
  hashtags?: string[];
};

export type DramaEpisode = {
  id: string;
  number: number;
  title: string;
  thumbnail?: string;
  locked?: boolean;
};

export type StreamResult = {
  url: string;
  quality?: string;
  type: "hls" | "mp4";
};

export type LocalVideo = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  thumbnailUrl: string;
  videoUrl: string;
  streamId: string | null;
  viewCount: number;
  likeCount: number;
  published: number;
  publishedAt: string | null;
  createdAt: string;
  hashtags: string[];
};

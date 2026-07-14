export interface HotItem {
  id: string;
  title: string;
  url: string;
  hot?: string | number;
  desc?: string;
  mobileUrl?: string;
}

export interface HotListResponse {
  name: string;
  subtitle?: string;
  updateTime?: string;
  fromCache?: boolean;
  data: HotItem[];
}

export interface SourceConfig {
  id: string;
  name: string;
  subtitle: string;
  category: SourceCategory;
  color: string;
  icon: string;
}

export type SourceCategory =
  | "综合"
  | "新闻"
  | "社交"
  | "科技"
  | "财经"
  | "娱乐"
  | "开发"
  | "人工智能"
  | "阅读"
  | "体育"
  | "产品"
  | "设计"
  | "汽车";

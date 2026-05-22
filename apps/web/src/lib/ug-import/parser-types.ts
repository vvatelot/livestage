export interface UgStoreTab {
  artist_name?: string;
  song_name?: string;
  tonality?: string;
  tab_url?: string;
}

export interface UgStoreTabView {
  wiki_tab?: { content?: string };
  tab?: { content?: string };
  meta?: {
    capo?: number | string;
    tonality?: string;
  };
}

export interface UgStoreData {
  store?: {
    page?: {
      data?: {
        tab?: UgStoreTab;
        tab_view?: UgStoreTabView;
      };
    };
  };
}

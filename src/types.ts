export interface Watch {
  label: string;
  category_id: number;
  marka_id: number;
  model_id: number;
  s_yers?: number;
  po_yers?: number;
  price_ot?: number;
  price_do?: number;
}

export interface AutoInfo {
  id: string;
  title: string;
  price: number | null;
  link: string;
}

export type SeenStore = Record<string, string[]>;

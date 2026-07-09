export interface Subscription {
  id: number;
  chatId: string;
  label: string;
  category_id: number;
  marka_id: number;
  model_id: number;
  s_yers?: number;
  po_yers?: number;
  price_ot?: number;
  price_do?: number;
  fuel_id?: number; // підтверджено: 2 = дизель
  gear_id?: number; // підтверджено: 2 = автомат
  drive_id?: number; // підтверджено: 3 = задній; повний ще не перевірено
}

export interface AutoInfo {
  id: string;
  title: string;
  price: number | null;
  link: string;
  isUniversal: boolean;
}

export type SeenStore = Record<string, string[]>;

export interface WizardData {
  markaId?: number;
  markaName?: string;
  modelId?: number;
  modelName?: string;
  s_yers?: number;
  po_yers?: number;
  price_ot?: number;
  price_do?: number;
}

export type WizardStep =
  | "marka"
  | "model"
  | "yearFrom"
  | "yearTo"
  | "priceFrom"
  | "priceTo"
  | "confirm";

export interface WizardEntry {
  step: WizardStep;
  data: WizardData;
}

export type WizardStore = Record<string, WizardEntry>;

export interface NamedValue {
  name: string;
  value: number;
}

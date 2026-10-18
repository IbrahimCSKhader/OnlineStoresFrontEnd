import { createContext } from "react";
import { getStorefrontLanguage } from "../../i18n/storefrontLanguages.js";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { formatUiDateTime } from "../../utils/numberFormat.js";

export const OwnerLanguageContext = createContext({
  ...getStorefrontLanguage("A"), language: "A", enabled: false, isLoading: false,
  t: value => value, setLanguage: () => {}, currency: formatCurrency, dateTime: formatUiDateTime,
});

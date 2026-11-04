import { useState } from "react";
import { IconButton, Menu, MenuItem } from "@mui/material";
import TranslateRounded from "@mui/icons-material/TranslateRounded";
import useStorefrontLanguage from "../../hooks/storefront/useStorefrontLanguage.js";
import { STOREFRONT_LANGUAGE_OPTIONS } from "../../i18n/storefrontLanguages.js";

export default function StorefrontLanguageMenu() {
  const [anchor, setAnchor] = useState(null);
  const { canSwitchLanguage, language, copy, setLanguage } = useStorefrontLanguage();
  if (!canSwitchLanguage) return null;
  return <>
    <IconButton className="store-navbar__icon-button" aria-label={copy.language} title={copy.language} aria-haspopup="menu" aria-controls={anchor ? "storefront-language-menu" : undefined} aria-expanded={Boolean(anchor)} onClick={event => setAnchor(event.currentTarget)}><TranslateRounded /></IconButton>
    <Menu id="storefront-language-menu" anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
      {STOREFRONT_LANGUAGE_OPTIONS.map(option => <MenuItem key={option.code} selected={option.code === language} onClick={() => { setLanguage(option.code); setAnchor(null); }}>{option.label}</MenuItem>)}
    </Menu>
  </>;
}

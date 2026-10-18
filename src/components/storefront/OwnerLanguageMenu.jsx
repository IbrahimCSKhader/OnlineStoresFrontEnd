import { useState } from "react";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import TranslateRounded from "@mui/icons-material/TranslateRounded";
import useOwnerLanguage from "../../hooks/storefront/useOwnerLanguage.js";
import { STOREFRONT_LANGUAGE_OPTIONS } from "../../i18n/storefrontLanguages.js";

export default function OwnerLanguageMenu() {
  const [anchor, setAnchor] = useState(null);
  const { enabled, language, copy, setLanguage } = useOwnerLanguage();
  if (!enabled) return null;
  return <>
    <IconButton aria-label={copy.language} title={copy.language} aria-haspopup="menu" aria-controls={anchor ? "owner-language-menu" : undefined} aria-expanded={Boolean(anchor)} onClick={event => setAnchor(event.currentTarget)}><TranslateRounded /></IconButton>
    <Menu id="owner-language-menu" anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
      {STOREFRONT_LANGUAGE_OPTIONS.map(option => <MenuItem key={option.code} selected={option.code === language} onClick={() => { setLanguage(option.code); setAnchor(null); }}>{option.label}</MenuItem>)}
    </Menu>
  </>;
}

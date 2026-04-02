import InputAdornment from "@mui/material/InputAdornment";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import AppTextField from "./AppTextField.jsx";

export default function SearchInput({
  value,
  onChange,
  placeholder = "ابحث عن متجر أو منتج أو تصنيف",
  className,
}) {
  return (
    <AppTextField
      type="search"
      size="small"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={className}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchRoundedIcon fontSize="small" />
          </InputAdornment>
        ),
      }}
    />
  );
}

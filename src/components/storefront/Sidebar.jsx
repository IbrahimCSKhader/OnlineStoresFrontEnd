import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import "./Sidebar.css";

export default function Sidebar({
  categories,
  selectedCategory,
  onSelectCategory,
  priceRange,
  onPriceRangeChange,
}) {
  return (
    <Box className="storefront-sidebar">
      <Box className="storefront-sidebar__section">
        <Typography variant="overline" className="storefront-sidebar__eyebrow">
          Browse
        </Typography>
        <Typography variant="h6" className="storefront-sidebar__title">
          Shop by category
        </Typography>
        <Stack spacing={1.1} className="storefront-sidebar__category-list">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = selectedCategory === category.id;

            return (
              <button
                key={category.id}
                type="button"
                className={`storefront-sidebar__category${
                  isActive ? " storefront-sidebar__category--active" : ""
                }`}
                onClick={() => onSelectCategory(category.id)}
              >
                <span className="storefront-sidebar__category-icon" aria-hidden>
                  <Icon fontSize="small" />
                </span>
                <span className="storefront-sidebar__category-text">{category.label}</span>
                <Chip
                  label={category.count}
                  size="small"
                  className="storefront-sidebar__badge"
                />
              </button>
            );
          })}
        </Stack>
      </Box>

      <Box className="storefront-sidebar__section">
        <Typography variant="overline" className="storefront-sidebar__eyebrow">
          Refine
        </Typography>
        <Box className="storefront-sidebar__range-header">
          <Typography variant="h6" className="storefront-sidebar__title">
            Price range
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ${priceRange[0]} - ${priceRange[1]}
          </Typography>
        </Box>
        <Slider
          min={80}
          max={1800}
          step={10}
          value={priceRange}
          onChange={(_, value) => onPriceRangeChange(value)}
          valueLabelDisplay="off"
          sx={{
            color: "var(--primary)",
            mt: 2,
            "& .MuiSlider-thumb": {
              width: 18,
              height: 18,
              boxShadow: "0 10px 20px rgba(48, 36, 25, 0.16)",
            },
            "& .MuiSlider-rail": {
              opacity: 1,
              backgroundColor: "rgba(84, 63, 49, 0.12)",
            },
          }}
        />
      </Box>
    </Box>
  );
}

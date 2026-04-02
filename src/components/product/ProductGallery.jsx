import { useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AppModal from "../common/modals/AppModal.jsx";
import { resolveAssetUrl } from "../../utils/assetUrl.js";

export default function ProductGallery({
  images,
  productName,
  selectedImageIndex,
  onSelectImage,
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const normalizedImages = images.length
    ? images
    : [{ id: "fallback", url: "", altText: productName }];
  const activeImage = normalizedImages[selectedImageIndex] || normalizedImages[0];
  const activeImageUrl = resolveAssetUrl(activeImage?.url);
  const hasMultipleImages = normalizedImages.length > 1;

  const navigateTo = useCallback((direction) => {
    if (!hasMultipleImages) return;

    const nextIndex =
      direction === "next"
        ? (selectedImageIndex + 1) % normalizedImages.length
        : (selectedImageIndex - 1 + normalizedImages.length) % normalizedImages.length;

    onSelectImage(nextIndex);
  }, [hasMultipleImages, normalizedImages.length, onSelectImage, selectedImageIndex]);

  useEffect(() => {
    if (!lightboxOpen || !hasMultipleImages) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "ArrowLeft") {
        navigateTo("previous");
      }

      if (event.key === "ArrowRight") {
        navigateTo("next");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasMultipleImages, lightboxOpen, navigateTo]);

  const renderThumbButton = (image, index) => {
    const thumbUrl = resolveAssetUrl(image?.url);
    const isActive = index === selectedImageIndex;

    return (
      <button
        key={image.id ?? `${image.url}-${index}`}
        type="button"
        className={`product-gallery__thumb${isActive ? " product-gallery__thumb--active" : ""}`}
        onClick={() => onSelectImage(index)}
      >
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt={image?.altText || `${productName} ${index + 1}`}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span>صورة</span>
        )}
      </button>
    );
  };

  return (
    <>
      <Box className="product-gallery">
        <Box className="product-gallery__main">
          {activeImageUrl ? (
            <button
              type="button"
              className="product-gallery__main-button"
              onClick={() => setLightboxOpen(true)}
              aria-label="فتح عرض الصور"
            >
              <img
                src={activeImageUrl}
                alt={activeImage?.altText || productName}
                className="product-gallery__image"
                decoding="async"
              />
              <span className="product-gallery__zoom-hint">عرض أكبر</span>
            </button>
          ) : (
            <Box className="product-gallery__empty">
              <Typography variant="body1" color="text.secondary">
                لا توجد صورة لهذا المنتج بعد
              </Typography>
            </Box>
          )}
        </Box>

        {hasMultipleImages ? (
          <Stack direction="row" spacing={1} className="product-gallery__thumbs">
            {normalizedImages.map(renderThumbButton)}
          </Stack>
        ) : null}
      </Box>

      <AppModal
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        maxWidth={false}
        PaperProps={{ className: "product-gallery__modal" }}
      >
        <Box className="product-gallery__lightbox">
          <Box className="product-gallery__lightbox-head">
            <Typography variant="subtitle1" className="product-gallery__lightbox-title">
              {productName}
            </Typography>
            <IconButton
              className="product-gallery__lightbox-close"
              onClick={() => setLightboxOpen(false)}
              aria-label="إغلاق المعرض"
            >
              <CloseRoundedIcon />
            </IconButton>
          </Box>

          <Box className="product-gallery__lightbox-stage">
            {hasMultipleImages ? (
              <IconButton
                className="product-gallery__lightbox-arrow"
                onClick={() => navigateTo("previous")}
                aria-label="الصورة السابقة"
              >
                <ChevronRightRoundedIcon />
              </IconButton>
            ) : null}

            <Box className="product-gallery__lightbox-frame">
              {activeImageUrl ? (
                <img
                  src={activeImageUrl}
                  alt={activeImage?.altText || productName}
                  className="product-gallery__lightbox-image"
                  decoding="async"
                />
              ) : (
                <Box className="product-gallery__lightbox-empty">
                  <Typography variant="body2" color="text.secondary">
                    لا توجد صورة لهذا المنتج بعد
                  </Typography>
                </Box>
              )}
            </Box>

            {hasMultipleImages ? (
              <IconButton
                className="product-gallery__lightbox-arrow"
                onClick={() => navigateTo("next")}
                aria-label="الصورة التالية"
              >
                <ChevronLeftRoundedIcon />
              </IconButton>
            ) : null}
          </Box>

          {hasMultipleImages ? (
            <Stack direction="row" spacing={1} className="product-gallery__lightbox-thumbs">
              {normalizedImages.map(renderThumbButton)}
            </Stack>
          ) : null}
        </Box>
      </AppModal>
    </>
  );
}

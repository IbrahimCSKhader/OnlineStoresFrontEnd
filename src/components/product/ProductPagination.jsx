import Box from "@mui/material/Box";
import Pagination from "@mui/material/Pagination";
import Typography from "@mui/material/Typography";

export default function ProductPagination({
  pagination,
  onPageChange,
  className = "",
}) {
  const totalPages = Number(pagination?.totalPages || 0);
  const page = Number(pagination?.page || 1);
  const totalCount = Number(pagination?.totalCount || 0);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <Box
      className={["product-pagination", className].filter(Boolean).join(" ")}
    >
      <Typography variant="body2" color="text.secondary">
        {totalCount.toLocaleString("ar")} نتيجة، صفحة {page.toLocaleString("ar")} من{" "}
        {totalPages.toLocaleString("ar")}
      </Typography>
      <Pagination
        count={totalPages}
        page={page}
        onChange={(_, nextPage) => onPageChange(nextPage)}
        color="primary"
        shape="rounded"
        siblingCount={1}
        boundaryCount={1}
      />
    </Box>
  );
}

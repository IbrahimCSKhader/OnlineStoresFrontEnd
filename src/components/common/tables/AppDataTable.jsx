import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

export default function AppDataTable({
  columns,
  rows,
  getRowId,
  emptyState,
  zebra = false,
}) {
  if (!rows.length) {
    return emptyState ?? null;
  }

  return (
    <Box
      className={[
        "app-data-table",
        zebra ? "app-data-table--zebra" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <TableContainer className="app-data-table__container">
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.key} className="app-data-table__head-cell">
                  {column.title}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((row) => {
              const rowId = getRowId ? getRowId(row) : row.id;

              return (
                <TableRow key={rowId} hover className="app-data-table__row">
                  {columns.map((column) => (
                    <TableCell key={column.key} className="app-data-table__cell">
                      {column.render ? (
                        column.render(row)
                      ) : (
                        <Box>
                          <Typography variant="body2">
                            {row[column.key] ?? "-"}
                          </Typography>
                        </Box>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

import { Parser } from "hot-formula-parser";

const parser = new Parser();

export function evaluateCell(
  raw: string,
  getCellValue: (col: string, row: number) => string
): string {
  if (!raw.startsWith("=")) return raw;

  parser.on("callCellValue", (cellCoord: any, done: any) => {
    const col = cellCoord.label.replace(/[0-9]/g, "");
    const row = parseInt(cellCoord.label.replace(/[^0-9]/g, ""));
    done(getCellValue(col, row) || 0);
  });

  parser.on("callRangeValue", (startCell: any, endCell: any, done: any) => {
    const startCol = startCell.label.charCodeAt(0) - 65;
    const endCol = endCell.label.charCodeAt(0) - 65;
    const startRow = startCell.row.index;
    const endRow = endCell.row.index;

    const matrix: number[][] = [];
    for (let r = startRow; r <= endRow; r++) {
      const rowData: number[] = [];
      for (let c = startCol; c <= endCol; c++) {
        const colLetter = String.fromCharCode(65 + c);
        rowData.push(Number(getCellValue(colLetter, r + 1)) || 0);
      }
      matrix.push(rowData);
    }
    done(matrix);
  });

  const result = parser.parse(raw.slice(1));
  return result.error ? result.error : String(result.result);
}
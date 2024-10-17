/* eslint-disable @typescript-eslint/array-type */
import { WebHareBlob } from "@webhare/services";
import writeXlsxFile, { type SheetData } from "write-excel-file";

function encodeExcelCSV(unquoted: string): string {
  return '"' + String(unquoted).replace(/"/g, '""') + '"';
}

function buildCSVLine(fields: string[]): string {
  return fields.join(',');
}

function buildCSV(lines: string[]): string {
  return lines.join('\n') + "\n";
}

export async function toCSV(data: WebHareBlob): Promise<string> {
  // console.error("toCSV",data);
  const jsonRows = (JSON.parse(await data.text()) as { value: object[] }).value;
  if (jsonRows.length === 0)
    return '';

  const headers = Object.keys(jsonRows[0]);
  const lines: string[] = [];
  lines.push(buildCSVLine(headers.map(encodeExcelCSV)));

  for (const row of jsonRows.slice(1)) {
    const line = headers.map(header => row[header]).map(encodeExcelCSV);
    lines.push(buildCSVLine(line));
  }
  return buildCSV(lines);
}

export async function toXLSX(sheets: Array<{
  name: string;
  data: WebHareBlob;
}>): Promise<WebHareBlob> {

  const datasets: SheetData[] = [];

  for (const sheet of sheets) {
    const jsonRows = (JSON.parse(await sheet.data.text()) as { value: Array<Record<string, unknown>> }).value;
    const headers = Object.keys(jsonRows[0]);
    const rows: SheetData = [];
    rows.push(headers.map(hdr => ({ value: hdr, fontWeight: 'bold' })));

    for (const row of jsonRows.slice(1))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- we just have to assume the decoded JSON is legit
      rows.push(headers.map(header => ({ value: row[header] as any })));

    datasets.push(rows);
  }

  const asblob: Blob = await writeXlsxFile(datasets, { sheets: sheets.map(sheet => sheet.name.substr(0, 31)) });
  return WebHareBlob.from(Buffer.from(await asblob.arrayBuffer()));
}

interface SKDBLegacyStructure {
  sheets: Record<string, Record<string, string>>;
}

export async function toStructure(sheets: Array<{
  name: string;
  data: WebHareBlob;
}>): Promise<WebHareBlob> {

  const structure: SKDBLegacyStructure = { sheets: {} };
  for (const sheet of sheets) {
    const jsonRows = (JSON.parse(await sheet.data.text()) as { value: Array<Record<string, unknown>> }).value;
    const headers = Object.keys(jsonRows[0]);
    const firstdata = jsonRows[0];
    if (!firstdata)
      continue;

    structure.sheets[sheet.name] = Object.fromEntries(headers.map(header => [header, typeof firstdata[header]]));
  }
  return WebHareBlob.from(JSON.stringify(structure, null, 2));
}

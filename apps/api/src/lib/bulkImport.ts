import { z } from 'zod';

const MAX_IMPORT_BYTES = 1_000_000;
const MAX_IMPORT_ROWS = 1_000;

export type ParsedImportRow = {
  rowNumber: number;
  values: Record<string, unknown>;
};

export type ImportError = {
  row: number;
  field?: string;
  message: string;
};

const aliases: Record<string, string> = {
  'hospital name': 'hospitalName',
  hospital_name: 'hospitalName',
  hospital: 'hospitalName',
  clinic: 'hospitalName',
  'clinic name': 'hospitalName',
  clinic_name: 'hospitalName',
  'head quarters': 'headquarters',
  headquarters: 'headquarters',
  headquarter: 'headquarters',
  'product name': 'productName',
  product_name: 'productName',
  'customer name': 'customerName',
  customer_name: 'customerName',
  sku: 'productSku',
  'product sku': 'productSku',
  product_sku: 'productSku',
};

function normalizeHeader(header: string) {
  const key = header.trim().toLowerCase().replace(/\s+/g, ' ');
  return aliases[key] || key.replace(/[- ]([a-z])/g, (_, letter) => letter.toUpperCase());
}

function parseCsv(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < csv.length; i += 1) {
    const character = csv[i];
    if (quoted) {
      if (character === '"' && csv[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ',') {
      row.push(field.trim());
      field = '';
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && csv[i + 1] === '\n') i += 1;
      row.push(field.trim());
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error('CSV contains an unterminated quoted field');
  if (field.length > 0 || row.length > 0) {
    row.push(field.trim());
    if (row.some((value) => value.length > 0)) rows.push(row);
  }
  return rows;
}

export function parseImportRows(input: unknown): ParsedImportRow[] {
  let rows: unknown;
  if (Array.isArray(input)) {
    rows = input;
  } else if (input && typeof input === 'object') {
    const body = input as Record<string, unknown>;
    if (Array.isArray(body.rows)) rows = body.rows;
    else if (typeof body.csv === 'string') rows = body.csv;
    else if (typeof body.content === 'string') rows = body.content;
    else if (typeof body.data === 'string') rows = body.data;
  }

  if (typeof rows === 'string') {
    if (Buffer.byteLength(rows, 'utf8') > MAX_IMPORT_BYTES) {
      throw new Error('Import payload is too large');
    }
    const csvRows = parseCsv(rows);
    if (csvRows.length < 2) return [];
    if (csvRows.length - 1 > MAX_IMPORT_ROWS) {
      throw new Error(`Import is limited to ${MAX_IMPORT_ROWS} rows per request`);
    }
    const headers = csvRows[0].map(normalizeHeader);
    if (headers.length > 50) throw new Error('Import contains too many columns');
    return csvRows.slice(1).map((values, index) => ({
      rowNumber: index + 2,
      values: headers.reduce<Record<string, unknown>>((record, header, fieldIndex) => {
        record[header] = values[fieldIndex] ?? '';
        return record;
      }, {}),
    }));
  }

  if (!Array.isArray(rows)) throw new Error('Provide rows as an array or a CSV string');
  if (Buffer.byteLength(JSON.stringify(rows), 'utf8') > MAX_IMPORT_BYTES) {
    throw new Error('Import payload is too large');
  }
  if (rows.length > MAX_IMPORT_ROWS) throw new Error(`Import is limited to ${MAX_IMPORT_ROWS} rows per request`);
  return rows.map((row, index) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      return { rowNumber: index + 1, values: {} };
    }
    return {
      rowNumber: index + 1,
      values: Object.entries(row as Record<string, unknown>).reduce<Record<string, unknown>>(
        (record, [key, value]) => {
          record[normalizeHeader(key)] = value;
          return record;
        },
        {}
      ),
    };
  });
}

export function validateImportRows<T>(
  input: unknown,
  schema: z.ZodType<T>
): { valid: Array<{ rowNumber: number; data: T }>; errors: ImportError[]; totalRows: number } {
  const rows = parseImportRows(input);
  const valid: Array<{ rowNumber: number; data: T }> = [];
  const errors: ImportError[] = [];

  rows.forEach(({ rowNumber, values }) => {
    const result = schema.safeParse(values);
    if (result.success) {
      valid.push({ rowNumber, data: result.data });
    } else {
      result.error.issues.forEach((issue) => {
        errors.push({
          row: rowNumber,
          field: issue.path.join('.') || undefined,
          message: issue.message,
        });
      });
    }
  });
  return { valid, errors, totalRows: rows.length };
}

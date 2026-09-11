import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { validateImportRows } from './bulkImport';

describe('bulk import validation', () => {
  const schema = z.object({
    name: z.string().min(2),
    quantity: z.coerce.number().int().positive(),
  });

  it('returns valid rows and row-level errors without aborting the batch', () => {
    const result = validateImportRows(
      { csv: 'name,quantity\nValid customer,4\n,0\nAnother customer,2' },
      schema
    );

    expect(result.totalRows).toBe(3);
    expect(result.valid).toHaveLength(2);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ row: 3, field: 'name' }),
        expect.objectContaining({ row: 3, field: 'quantity' }),
      ])
    );
  });

  it('rejects malformed quoted CSV', () => {
    expect(() => validateImportRows({ csv: 'name,quantity\n"Unclosed,2' }, schema)).toThrow(
      'unterminated quoted field'
    );
  });
});

import {
  buildAnalyticsExportFilename,
  buildContentDisposition,
  CSV_DELIMITER,
  escapeCsvCell,
  formatCsvRow,
  sanitizeExportFilenamePart,
} from './csv.util';

describe('csv.util', () => {
  it('escapes semicolon delimiter', () => {
    expect(escapeCsvCell('a;b')).toBe('"a;b"');
  });

  it('allows comma inside semicolon-delimited cells without quoting', () => {
    expect(formatCsvRow(['hello', 'world, test'])).toBe('hello;world, test');
  });

  it('escapes double quotes', () => {
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""');
  });

  it('escapes newlines', () => {
    expect(escapeCsvCell('line1\nline2')).toBe('"line1\nline2"');
  });

  it('handles Cyrillic and Kazakh text', () => {
    expect(escapeCsvCell('Аудитория')).toBe('Аудитория');
    expect(escapeCsvCell('Қазақша')).toBe('Қазақша');
  });

  it('prefixes formula injection cells', () => {
    expect(escapeCsvCell('=1+1')).toBe("'=1+1");
    expect(escapeCsvCell('+77000000001')).toBe("'+77000000001");
    expect(escapeCsvCell('-100')).toBe("'-100");
    expect(escapeCsvCell('@SUM(A1)')).toBe("'@SUM(A1)");
  });

  it('handles empty and null', () => {
    expect(escapeCsvCell('')).toBe('');
    expect(escapeCsvCell(null)).toBe('');
    expect(escapeCsvCell(undefined)).toBe('');
  });

  it('formats percentage row', () => {
    expect(formatCsvRow(['Доля', '31.2%'])).toBe(`Доля;31.2%`);
  });

  it('uses semicolon delimiter', () => {
    expect(CSV_DELIMITER).toBe(';');
  });

  it('sanitizes filename parts', () => {
    expect(sanitizeExportFilenamePart('Кофейня / Test')).toMatch(/Кофейня/);
    expect(buildAnalyticsExportFilename('biz1', 'Кофейня', new Date('2026-09-08'))).toBe(
      'qalago-analytics-Кофейня-2026-09-08.csv',
    );
  });

  it('builds safe Content-Disposition', () => {
    const header = buildContentDisposition('qalago-analytics-test-2026-09-08.csv');
    expect(header).toContain('attachment');
    expect(header).toContain('filename=');
  });
});

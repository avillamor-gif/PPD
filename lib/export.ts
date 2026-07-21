import ExcelJS from 'exceljs';

export interface PolicyExportData {
  id: string;
  slug: string;
  title: string;
  commencement_date?: string;
  country: string;
  level?: string;
  category: string;
  status: string;
  lifecycle_stage?: string;
  authority: string;
  link: string;
  other_links?: string;
  summary?: string;
  keywords?: string;
  language?: string;
}

export async function formatPoliciesToExcel(policies: PolicyExportData[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Policies', {
    pageSetup: { paperSize: 9, orientation: 'landscape' },
  });

  // Define columns
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 12, hidden: true },
    { header: 'Policy Title', key: 'title', width: 35 },
    { header: 'Country', key: 'country', width: 15 },
    { header: 'Level', key: 'level', width: 12 },
    { header: 'Date of Enactment/Commencement', key: 'commencement_date', width: 18 },
    { header: 'Instrument Type', key: 'category', width: 18 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Lifecycle Stage', key: 'lifecycle_stage', width: 15 },
    { header: 'Authority', key: 'authority', width: 20 },
    { header: 'Summary', key: 'summary', width: 40 },
    { header: 'Keywords', key: 'keywords', width: 20 },
    { header: 'Language', key: 'language', width: 10 },
    { header: 'Official Link', key: 'link', width: 30 },
    { header: 'Other Links', key: 'other_links', width: 30 },
  ];

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = {
    bold: true,
    color: { argb: 'FFFFFFFF' },
    size: 12,
  };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1F4E78' }, // Dark blue
  };
  headerRow.alignment = {
    horizontal: 'center',
    vertical: 'middle',
    wrapText: true,
  };

  // Add data rows
  policies.forEach((policy, index) => {
    const row = worksheet.addRow(policy);

    // Alternate row colors
    if (index % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF2F2F2' }, // Light gray
      };
    }

    // Style data cells
    row.font = { size: 10 };
    row.alignment = {
      horizontal: 'left',
      vertical: 'top',
      wrapText: true,
    };

    // Make link columns blue and underlined
    const linkCell = row.getCell('link');
    linkCell.font = {
      color: { argb: 'FF0563C1' },
      underline: 'single',
    };
    
    const otherLinksCell = row.getCell('other_links');
    otherLinksCell.font = {
      color: { argb: 'FF0563C1' },
      underline: 'single',
    };
  });

  // Freeze header row
  worksheet.views = [
    {
      state: 'frozen',
      ySplit: 1,
      xSplit: 0,
      activeCell: 'A2',
      showGridLines: true,
    },
  ];

  // Auto-fit column widths based on content
  worksheet.columns.forEach((column) => {
    if (column.header !== 'ID') {
      let maxLength = (column.header as string).length;
      column.eachCell?.({ includeEmpty: false }, (cell) => {
        const cellLength = cell.value?.toString().length || 0;
        if (cellLength > maxLength) {
          maxLength = cellLength;
        }
      });
      column.width = Math.min(maxLength + 2, 50);
    }
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as unknown as Buffer;
}

export function generateFilename(filters: Record<string, string | number | undefined>): string {
  const timestamp = new Date().toISOString().split('T')[0];
  const parts = ['policies', timestamp];

  if (filters.country) parts.push(`country-${filters.country}`);
  if (filters.year) parts.push(`year-${filters.year}`);
  if (filters.category) parts.push(`category-${filters.category}`);

  return `${parts.join('_')}.xlsx`;
}

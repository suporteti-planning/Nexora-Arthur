export interface NotebookImportResult {
  success: boolean;
  totalRows: number;
  imported: number;
  updated: number;
  errors: number;
  importedNotebooks: string[];
  errorDetails: Record<string, string>;
  message: string;
}
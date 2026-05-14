/**
 * Google Sheets API service for authentication and spreadsheet operations.
 * 
 * This service handles:
 * - Google OAuth 2.0 authentication
 * - Google Sheets API initialization
 * - Creating spreadsheets with multiple sheets
 * - Batch updating spreadsheet data and formatting
 * 
 * Uses the Google APIs JavaScript client library (gapi) for authentication
 * and the Google Sheets API v4 for spreadsheet operations.
 * 
 * Dependencies:
 * - gapi-script: https://www.npmjs.com/package/gapi-script
 * - Google APIs JavaScript client: https://developers.google.com/api-client-library/javascript
 */

import { gapi } from 'gapi-script';

// Extend the gapi types to include the properties we need
declare global {
  interface Window {
    gapi: any;
  }
}

// Google API configuration
const CLIENT_ID = '337640530335-85k0ifb0bq4mm63qungn860fm67bniir.apps.googleusercontent.com';
const API_KEY = 'AIzaSyDg8UhNO0hCyeS2Vij-4ziAVZAv7JldkqY';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';

export interface GoogleUser {
  id: string;
  name: string;
  email: string;
  picture?: string;
}

export interface GoogleSheetsError {
  message: string;
  code?: number;
  details?: any;
}

class GoogleSheetsService {
  private isInitialized = false;
  private isSignedIn = false;
  private currentUser: GoogleUser | null = null;

  /**
   * Initialize the Google APIs client
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await gapi.load('client:auth2', async () => {
        await gapi.client.init({
          apiKey: API_KEY,
          clientId: CLIENT_ID,
          discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
          scope: SCOPES,
        });

        this.isInitialized = true;
        
        // Check if user is already signed in
        const authInstance = (gapi as any).auth2.getAuthInstance();
        this.isSignedIn = authInstance.isSignedIn.get();
        
        if (this.isSignedIn) {
          await this.updateCurrentUser();
        }
      });
    } catch (error) {
      console.error('Failed to initialize Google APIs:', error);
      // Don't throw error immediately, allow retry
      this.isInitialized = false;
      throw new Error(`Failed to initialize Google Sheets service: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Sign in to Google
   */
  async signIn(): Promise<GoogleUser> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const authInstance = (gapi as any).auth2.getAuthInstance();
      const user = await authInstance.signIn({ scope: SCOPES });
      this.isSignedIn = true;
      await this.updateCurrentUser();
      return this.currentUser!;
    } catch (error) {
      console.error('Google sign-in failed:', error);
      throw new Error('Failed to sign in to Google');
    }
  }

  /**
   * Sign out from Google
   */
  async signOut(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      const authInstance = (gapi as any).auth2.getAuthInstance();
      await authInstance.signOut();
      this.isSignedIn = false;
      this.currentUser = null;
    } catch (error) {
      console.error('Google sign-out failed:', error);
      throw new Error('Failed to sign out from Google');
    }
  }

  /**
   * Get current user information
   */
  getCurrentUser(): GoogleUser | null {
    return this.currentUser;
  }

  /**
   * Check if user is signed in
   */
  isUserSignedIn(): boolean {
    return this.isSignedIn;
  }

  /**
   * Update current user information
   */
  private async updateCurrentUser(): Promise<void> {
    if (!this.isSignedIn) return;

    try {
      const authInstance = (gapi as any).auth2.getAuthInstance();
      const user = authInstance.currentUser.get();
      const profile = user.getBasicProfile();

      this.currentUser = {
        id: profile.getId(),
        name: profile.getName(),
        email: profile.getEmail(),
        picture: profile.getImageUrl(),
      };
    } catch (error) {
      console.error('Failed to update current user:', error);
    }
  }

  /**
   * Create a new Google Spreadsheet with multiple sheets
   */
  async createSpreadsheet(
    title: string,
    csvSheets: { name: string; csvContent: string }[],
    billSheetData: any[][]
  ): Promise<string> {
    if (!this.isSignedIn) {
      throw new Error('User must be signed in to create spreadsheets');
    }

    try {
      // Bill sheet is appended after the CSV sheets
      const allSheetNames = [...csvSheets.map(s => s.name), 'Bill'];

      // Frozen columns per sheet: Records=3, Account Summary=2, Statement Summary=3, Check Summary=1, Bill=0
      const frozenCols = [3, 2, 3, 1, 0];

      const createResponse = await (gapi as any).client.sheets.spreadsheets.create({
        resource: {
          properties: { title },
          sheets: allSheetNames.map((name, i) => ({
            properties: {
              title: name,
              gridProperties: {
                frozenRowCount: i < csvSheets.length ? 1 : 0,
                frozenColumnCount: frozenCols[i] ?? 0,
              },
            },
          })),
        },
      });

      const spreadsheetId = createResponse.result.spreadsheetId!;
      const sheetIds: number[] = createResponse.result.sheets!.map(
        (sh: any) => sh.properties!.sheetId!
      );

      const requests: any[] = [];

      // Paste CSV data into the non-Bill sheets
      csvSheets.forEach((sheet, i) => {
        requests.push({
          pasteData: {
            coordinate: { sheetId: sheetIds[i], rowIndex: 0, columnIndex: 0 },
            data: sheet.csvContent,
            delimiter: ',',
          },
        });
      });

      // Bold header row on every sheet
      sheetIds.forEach(sheetId => {
        requests.push({
          repeatCell: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
            cell: { userEnteredFormat: { textFormat: { bold: true } } },
            fields: 'userEnteredFormat.textFormat.bold',
          },
        });
      });

      // ── Records (index 0) ───────────────────────────────────────────────────
      const recordsId = sheetIds[0];
      requests.push(
        // Col A bold
        {
          repeatCell: {
            range: { sheetId: recordsId, startColumnIndex: 0, endColumnIndex: 1 },
            cell: { userEnteredFormat: { textFormat: { bold: true } } },
            fields: 'userEnteredFormat.textFormat.bold',
          },
        },
        // Col A = date
        {
          repeatCell: {
            range: { sheetId: recordsId, startColumnIndex: 0, endColumnIndex: 1 },
            cell: { userEnteredFormat: { numberFormat: { type: 'DATE' } } },
            fields: 'userEnteredFormat.numberFormat',
          },
        },
        // Col C = currency (Amount)
        {
          repeatCell: {
            range: { sheetId: recordsId, startColumnIndex: 2, endColumnIndex: 3 },
            cell: { userEnteredFormat: { numberFormat: { type: 'CURRENCY' } } },
            fields: 'userEnteredFormat.numberFormat',
          },
        },
        // Col G = date (Statement Date)
        {
          repeatCell: {
            range: { sheetId: recordsId, startColumnIndex: 6, endColumnIndex: 7 },
            cell: { userEnteredFormat: { numberFormat: { type: 'DATE' } } },
            fields: 'userEnteredFormat.numberFormat',
          },
        }
      );

      // ── Account Summary (index 1) ───────────────────────────────────────────
      const accountSummaryId = sheetIds[1];
      requests.push(
        // Col A bold
        {
          repeatCell: {
            range: { sheetId: accountSummaryId, startColumnIndex: 0, endColumnIndex: 1 },
            cell: { userEnteredFormat: { textFormat: { bold: true } } },
            fields: 'userEnteredFormat.textFormat.bold',
          },
        },
        // Cols C & D = date (First/Last Statement)
        {
          repeatCell: {
            range: { sheetId: accountSummaryId, startColumnIndex: 2, endColumnIndex: 4 },
            cell: { userEnteredFormat: { numberFormat: { type: 'DATE' } } },
            fields: 'userEnteredFormat.numberFormat',
          },
        }
      );

      // ── Statement Summary (index 2) ─────────────────────────────────────────
      const statementSummaryId = sheetIds[2];
      requests.push(
        // Col A bold (Account)
        {
          repeatCell: {
            range: { sheetId: statementSummaryId, startColumnIndex: 0, endColumnIndex: 1 },
            cell: { userEnteredFormat: { textFormat: { bold: true } } },
            fields: 'userEnteredFormat.textFormat.bold',
          },
        },
        // Col C = date
        {
          repeatCell: {
            range: { sheetId: statementSummaryId, startColumnIndex: 2, endColumnIndex: 3 },
            cell: { userEnteredFormat: { numberFormat: { type: 'DATE' } } },
            fields: 'userEnteredFormat.numberFormat',
          },
        },
        // Cols D–F = currency (Beginning Balance, Ending Balance, Net Transactions)
        {
          repeatCell: {
            range: { sheetId: statementSummaryId, startColumnIndex: 3, endColumnIndex: 6 },
            cell: { userEnteredFormat: { numberFormat: { type: 'CURRENCY' } } },
            fields: 'userEnteredFormat.numberFormat',
          },
        }
      );

      // ── Check Summary (index 3) ─────────────────────────────────────────────
      // Header is on row 4 (index 3); data starts at row 5 (index 4)
      const checkSummaryId = sheetIds[3];
      requests.push(
        // Bold actual header row (row 4)
        {
          repeatCell: {
            range: { sheetId: checkSummaryId, startRowIndex: 3, endRowIndex: 4 },
            cell: { userEnteredFormat: { textFormat: { bold: true } } },
            fields: 'userEnteredFormat.textFormat.bold',
          },
        },
        // Col D (data rows) = date
        {
          repeatCell: {
            range: { sheetId: checkSummaryId, startRowIndex: 4, startColumnIndex: 3, endColumnIndex: 4 },
            cell: { userEnteredFormat: { numberFormat: { type: 'DATE' } } },
            fields: 'userEnteredFormat.numberFormat',
          },
        },
        // Col E (data rows) = currency
        {
          repeatCell: {
            range: { sheetId: checkSummaryId, startRowIndex: 4, startColumnIndex: 4, endColumnIndex: 5 },
            cell: { userEnteredFormat: { numberFormat: { type: 'CURRENCY' } } },
            fields: 'userEnteredFormat.numberFormat',
          },
        }
      );

      // ── Bill (index 4) ──────────────────────────────────────────────────────
      const billId = sheetIds[4];
      requests.push(
        // Col A bold (row labels: Amount, Price, Total)
        {
          repeatCell: {
            range: { sheetId: billId, startColumnIndex: 0, endColumnIndex: 1 },
            cell: { userEnteredFormat: { textFormat: { bold: true } } },
            fields: 'userEnteredFormat.textFormat.bold',
          },
        },
        // Row 3 (Price, index 2) cols B–G = currency
        {
          repeatCell: {
            range: { sheetId: billId, startRowIndex: 2, endRowIndex: 3, startColumnIndex: 1, endColumnIndex: 7 },
            cell: { userEnteredFormat: { numberFormat: { type: 'CURRENCY' } } },
            fields: 'userEnteredFormat.numberFormat',
          },
        },
        // Row 4 (Total, index 3) cols B–G = currency
        {
          repeatCell: {
            range: { sheetId: billId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 1, endColumnIndex: 7 },
            cell: { userEnteredFormat: { numberFormat: { type: 'CURRENCY' } } },
            fields: 'userEnteredFormat.numberFormat',
          },
        },
        // G4 (grand total cell, row index 3, col index 6) bold
        {
          repeatCell: {
            range: { sheetId: billId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 6, endColumnIndex: 7 },
            cell: { userEnteredFormat: { textFormat: { bold: true } } },
            fields: 'userEnteredFormat.textFormat.bold',
          },
        }
      );

      await (gapi as any).client.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: { requests },
      });

      // Write Bill sheet with formulas via values API (USER_ENTERED interprets = as formulas)
      await (gapi as any).client.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Bill!A1',
        valueInputOption: 'USER_ENTERED',
        resource: { values: billSheetData },
      });

      return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
    } catch (error) {
      console.error('Failed to create spreadsheet:', error);
      throw new Error('Failed to create Google Spreadsheet');
    }
  }
}

export default new GoogleSheetsService();

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
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';

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
      const user = await authInstance.signIn();
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
    recordsData: string,
    accountSummaryData: string,
    statementSummaryData: string,
    checkSummaryData: string
  ): Promise<string> {
    if (!this.isSignedIn) {
      throw new Error('User must be signed in to create spreadsheets');
    }

    try {
      // Create the spreadsheet
      const createResponse = await (gapi as any).client.sheets.spreadsheets.create({
        resource: {
          properties: {
            title: title
          },
          sheets: [
            {
              properties: {
                title: "Records",
                gridProperties: {
                  frozenRowCount: 1,
                  frozenColumnCount: 1
                }
              }
            },
            {
              properties: {
                title: "Account Summary",
                gridProperties: {
                  frozenRowCount: 1,
                  frozenColumnCount: 1
                }
              }
            },
            {
              properties: {
                title: "Statement Summary",
                gridProperties: {
                  frozenRowCount: 1,
                  frozenColumnCount: 1
                }
              }
            },
            {
              properties: {
                title: "Check Summary",
                gridProperties: {
                  frozenRowCount: 1,
                  frozenColumnCount: 1
                }
              }
            }
          ]
        }
      });

      const spreadsheetId = createResponse.result.spreadsheetId!;
      const recordsSheetId = createResponse.result.sheets![0].properties!.sheetId!;

      // Batch update with data and formatting
      await (gapi as any).client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: spreadsheetId,
        resource: {
          requests: [
            // Paste record data
            {
              pasteData: {
                coordinate: {
                  sheetId: recordsSheetId,
                  rowIndex: 0,
                  columnIndex: 0
                },
                data: recordsData,
                delimiter: ","
              }
            },
            // Paste account summary data
            {
              pasteData: {
                coordinate: {
                  sheetId: createResponse.result.sheets![1].properties!.sheetId!,
                  rowIndex: 0,
                  columnIndex: 0
                },
                data: accountSummaryData,
                delimiter: ","
              }
            },
            // Paste statement summary data
            {
              pasteData: {
                coordinate: {
                  sheetId: createResponse.result.sheets![2].properties!.sheetId!,
                  rowIndex: 0,
                  columnIndex: 0
                },
                data: statementSummaryData,
                delimiter: ","
              }
            },
            // Paste check summary data
            {
              pasteData: {
                coordinate: {
                  sheetId: createResponse.result.sheets![3].properties!.sheetId!,
                  rowIndex: 0,
                  columnIndex: 0
                },
                data: checkSummaryData,
                delimiter: ","
              }
            },
            // (Records) Bold the entire first row
            {
              repeatCell: {
                range: {
                  sheetId: recordsSheetId,
                  startRowIndex: 0,
                  endRowIndex: 1
                },
                cell: { userEnteredFormat: { textFormat: { bold: true } } },
                fields: "userEnteredFormat.textFormat.bold"
              }
            },
            // (Records) Bold the entire first column
            {
              repeatCell: {
                range: {
                  sheetId: recordsSheetId,
                  startColumnIndex: 0,
                  endColumnIndex: 1
                },
                cell: { userEnteredFormat: { textFormat: { bold: true } } },
                fields: "userEnteredFormat.textFormat.bold"
              }
            },
            // (Records) Format the first column as a date
            {
              repeatCell: {
                range: {
                  sheetId: recordsSheetId,
                  startColumnIndex: 0,
                  endColumnIndex: 1
                },
                cell: { userEnteredFormat: { numberFormat: { type: "DATE" } } },
                fields: "userEnteredFormat.numberFormat"
              }
            },
            // (Records) Format the 3rd column as currency
            {
              repeatCell: {
                range: {
                  sheetId: recordsSheetId,
                  startColumnIndex: 2,
                  endColumnIndex: 3
                },
                cell: { userEnteredFormat: { numberFormat: { type: "CURRENCY" } } },
                fields: "userEnteredFormat.numberFormat"
              }
            },
            // (Records) Format the 7th column as a date
            {
              repeatCell: {
                range: {
                  sheetId: recordsSheetId,
                  startColumnIndex: 6,
                  endColumnIndex: 7
                },
                cell: { userEnteredFormat: { numberFormat: { type: "DATE" } } },
                fields: "userEnteredFormat.numberFormat"
              }
            }
          ]
        }
      });

      return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
    } catch (error) {
      console.error('Failed to create spreadsheet:', error);
      throw new Error('Failed to create Google Spreadsheet');
    }
  }
}

export default new GoogleSheetsService();

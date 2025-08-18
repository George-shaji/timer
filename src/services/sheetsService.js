// Google Sheets Service for Timer Data
import googleSheetsAPI from './googleSheetsAPI.js'

class SheetsService {
  constructor() {
    this.api = googleSheetsAPI
  }

  // Get all timer data from the sheet
  async getTimerData() {
    return await this.api.getTimerData()
  }

  // Get timer data for specific user
  async getUserTimerData(userEmail) {
    return await this.api.getUserTimerData(userEmail)
  }

  // Save timer data to sheet
  async saveTimerData(userData) {
    return await this.api.appendTimerData(userData)
  }

  // Get spreadsheet data from Google Sheets
  async getSpreadsheetData() {
    return await this.getTimerData()
  }

  // Create a CSV export from Google Sheets data
  async exportToCSV() {
    return await this.api.exportToCSV()
  }

  // Download CSV file
  async downloadCSV() {
    return await this.api.downloadCSV()
  }

  // Test Google Sheets connection
  async testConnection() {
    return await this.api.testConnection()
  }
}

export default new SheetsService()

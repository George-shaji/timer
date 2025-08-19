// Calendar Service for fetching data from Sheet2
import axios from 'axios'

class CalendarService {
  constructor() {
    // Configuration - using the same settings as googleSheetsAPI
    this.SPREADSHEET_ID = '1C1RhDiWjr1EI29YXfTr_AE_lds5zI3dWR7ed8UH5N1s'
    this.API_KEY = 'AIzaSyAPmsV-l3Mzs5iE_cOX5W4iuFMrHHEH35I'
    this.SHEET2_NAME = 'Sheet2'
    this.BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets'
  }

  // Fetch cell notes from Sheet2
  async fetchCellNotes() {
    try {
      console.log('Fetching cell notes from Sheet2...')
      
      const response = await axios.get(
        `${this.BASE_URL}/${this.SPREADSHEET_ID}?key=${this.API_KEY}&includeGridData=true&ranges=${this.SHEET2_NAME}!A:Z&fields=sheets.data.rowData.values.note`
      )
      
      const sheets = response.data.sheets || []
      const cellNotes = {}
      
      if (sheets.length > 0 && sheets[0].data && sheets[0].data[0]) {
        const rowData = sheets[0].data[0].rowData || []
        
        rowData.forEach((row, rowIndex) => {
          if (row.values) {
            row.values.forEach((cell, colIndex) => {
              if (cell.note) {
                const cellRef = this.getCellReference(rowIndex, colIndex)
                cellNotes[cellRef] = cell.note
              }
            })
          }
        })
      }
      
      console.log('Cell notes found:', Object.keys(cellNotes).length)
      return cellNotes
    } catch (error) {
      console.error('Error fetching cell notes:', error)
      return {}
    }
  }

  // Convert row/column indices to cell reference (e.g., A1, B2)
  getCellReference(rowIndex, colIndex) {
    const columnLetter = String.fromCharCode(65 + colIndex) // A, B, C, etc.
    return `${columnLetter}${rowIndex + 1}`
  }

  // Get column index for a given header
  getColumnIndex(headers, headerName) {
    return headers.findIndex(header => 
      header.toLowerCase() === headerName.toLowerCase()
    )
  }

  // Fetch data from Sheet2
  async fetchDataFromSheet2() {
    try {
      console.log('Fetching data from Sheet2...')
      
      // Fetch both values and cell notes
      const [valuesResponse, cellNotes] = await Promise.all([
        axios.get(`${this.BASE_URL}/${this.SPREADSHEET_ID}/values/${this.SHEET2_NAME}!A:Z?key=${this.API_KEY}`),
        this.fetchCellNotes()
      ])
      
      const rows = valuesResponse.data.values || []
      
      if (rows.length === 0) {
        console.log('No data found in Sheet2')
        return {
          success: true,
          data: [],
          headers: [],
          rowCount: 0
        }
      }
      
      // If there's a header row, separate it from the data
      const headers = rows[0] || []
      const dataRows = rows.slice(1)
      
      // Convert rows to objects using headers as keys
      const sheet2Data = dataRows.map((row, dataRowIndex) => {
        const rowObject = {}
        const actualRowIndex = dataRowIndex + 1 // +1 because we skipped header row
        
        headers.forEach((header, colIndex) => {
          // Clean header names and handle empty cells
          const cleanHeader = header.trim()
          const cellValue = row[colIndex] || ''
          const cellRef = this.getCellReference(actualRowIndex, colIndex)
          const cellNote = cellNotes[cellRef] || ''
          
          rowObject[cleanHeader] = {
            value: cellValue,
            note: cellNote,
            toString: () => cellValue // For backward compatibility
          }
          
          // Also store the raw value for easy access
          rowObject[`${cleanHeader}_value`] = cellValue
          rowObject[`${cleanHeader}_note`] = cellNote
        })
        return rowObject
      })
      
      console.log(`Successfully fetched ${sheet2Data.length} records from Sheet2`)
      console.log('Headers found:', headers)
      console.log('Cell notes found:', Object.keys(cellNotes).length)
      console.log('Sample data access - First row Sunday:', sheet2Data[0] ? sheet2Data[0]['Sunday_value'] : 'No data')

      return {
        success: true,
        data: sheet2Data,
        headers: headers,
        cellNotes: cellNotes,
        rowCount: sheet2Data.length,
        // Helper methods for easy data access
        getByIndex: (index) => sheet2Data[index] || null,
        getByDay: (rowIndex, day) => sheet2Data[rowIndex] ? sheet2Data[rowIndex][`${day}_value`] : null,
        getCellNote: (rowIndex, day) => sheet2Data[rowIndex] ? sheet2Data[rowIndex][`${day}_note`] : null,
        getAllDays: (rowIndex) => {
          if (!sheet2Data[rowIndex]) return null;
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const dayData = {};
          days.forEach(day => {
            if (sheet2Data[rowIndex][`${day}_value`] !== undefined) {
              dayData[day] = {
                value: sheet2Data[rowIndex][`${day}_value`],
                note: sheet2Data[rowIndex][`${day}_note`] || ''
              };
            }
          });
          return dayData;
        }
      }
      
    } catch (error) {
      console.error('Error fetching data from Sheet2:', error)
      
      if (error.response) {
        console.error('Error status:', error.response.status)
        console.error('Error data:', error.response.data)
      }
      
      return {
        success: false,
        error: error.message,
        details: error.response?.data || 'Network error',
        data: []
      }
    }
  }

  // Quick access method for getting specific day data
  async getFridayData(rowIndex = 0) {
    const result = await this.fetchDataFromSheet2()
    if (result.success && result.data[rowIndex]) {
      return {
        value: result.data[rowIndex]['Friday_value'] || null,
        note: result.data[rowIndex]['Friday_note'] || ''
      }
    }
    return null
  }

  // Get specific day data for any day
  async getDayData(day, rowIndex = 0) {
    const result = await this.fetchDataFromSheet2()
    if (result.success && result.data[rowIndex]) {
      return {
        value: result.data[rowIndex][`${day}_value`] || null,
        note: result.data[rowIndex][`${day}_note`] || ''
      }
    }
    return null
  }

  // Get all week data for a specific row
  async getWeekData(rowIndex = 0) {
    const result = await this.fetchDataFromSheet2()
    if (result.success && result.data[rowIndex]) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const weekData = {}
      days.forEach(day => {
        weekData[day] = {
          value: result.data[rowIndex][`${day}_value`] || '',
          note: result.data[rowIndex][`${day}_note`] || ''
        }
      })
      return weekData
    }
    return null
  }

  // Get notes for a specific date
  async getNotesForDate(date, rowIndex = 0) {
    const result = await this.fetchDataFromSheet2()
    if (result.success && result.data[rowIndex]) {
      const row = result.data[rowIndex]
      
      // Check if the date exists in any day column
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      for (const day of days) {
        if (row[`${day}_value`] === date) {
          // Return associated notes from Reasons/Leaves columns and cell notes
          return {
            date: date,
            day: day,
            cellNote: row[`${day}_note`] || '',
            reasons: row['Reasons_value'] || row['reasons_value'] || '',
            leaves: row['Leaves_value'] || row['leaves_value'] || '',
            rowIndex: rowIndex
          }
        }
      }
    }
    return null
  }

  // Get all dates with their notes for a specific row
  async getAllDatesWithNotes(rowIndex = 0) {
    const result = await this.fetchDataFromSheet2()
    if (result.success && result.data[rowIndex]) {
      const row = result.data[rowIndex]
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const datesWithNotes = []
      
      days.forEach(day => {
        const date = row[`${day}_value`]
        const cellNote = row[`${day}_note`] || ''
        if (date && date.trim() !== '' && date.trim() !== '-') {
          datesWithNotes.push({
            date: date,
            day: day,
            cellNote: cellNote,
            reasons: row['Reasons_value'] || row['reasons_value'] || '',
            leaves: row['Leaves_value'] || row['leaves_value'] || '',
            hasNotes: (row['Reasons_value'] && row['Reasons_value'].trim() !== '') || 
                     (row['Leaves_value'] && row['Leaves_value'].trim() !== '') ||
                     (cellNote && cellNote.trim() !== '')
          })
        }
      })
      
      return datesWithNotes
    }
    return []
  }
}

export default new CalendarService()
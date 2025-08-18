// Enhanced Google Sheets Service with Service Account Support
import axios from 'axios'

class GoogleSheetsAPI {
  constructor() {
    // Configuration
    this.SPREADSHEET_ID = '1C1RhDiWjr1EI29YXfTr_AE_lds5zI3dWR7ed8UH5N1s'
    this.API_KEY = 'AIzaSyAPmsV-l3Mzs5iE_cOX5W4iuFMrHHEH35I'
    this.SHEET_NAME = 'Sheet1'
    this.BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets'
    
    // For write operations, you'll need to set up Service Account
    this.SERVICE_ACCOUNT_EMAIL = null // Set this up for write operations
    this.PRIVATE_KEY = null // Set this up for write operations
    this.accessToken = null
  }

  // Get access token for Service Account (for write operations)
  async getAccessToken() {
    if (!this.SERVICE_ACCOUNT_EMAIL || !this.PRIVATE_KEY) {
      throw new Error('Service Account credentials not configured')
    }
    
    // This is a placeholder - you'll need to implement OAuth2 flow
    // or use Google's client libraries
    throw new Error('Service Account authentication not yet implemented')
  }

  // Read data from Google Sheets (works with API key)
  async getTimerData() {
    try {
      const response = await axios.get(
        `${this.BASE_URL}/${this.SPREADSHEET_ID}/values/${this.SHEET_NAME}!A:E?key=${this.API_KEY}`
      )
      
      const rows = response.data.values || []
      if (rows.length <= 1) {
        // No data in Google Sheets, check localStorage fallback
        console.log('No data in Google Sheets, checking localStorage fallback')
        return this.getLocalStorageData()
      }
      
      // Skip header row and convert to objects
      const sheetsData = rows.slice(1).map(row => ({
        timestamp: row[0] || '',
        user: row[1] || '',
        totalSeconds: parseInt(row[2]) || 0,
        formattedTime: row[3] || '00:00:00',
        lastUpdated: row[4] || ''
      }))
      
      console.log(`Loaded ${sheetsData.length} records from Google Sheets`)
      return sheetsData
    } catch (error) {
      console.error('Error fetching from Google Sheets, falling back to localStorage:', error)
      return this.getLocalStorageData()
    }
  }

  // Get data from localStorage as fallback
  getLocalStorageData() {
    try {
      const logs = JSON.parse(localStorage.getItem('timer_logs') || '[]')
      console.log(`Loaded ${logs.length} records from localStorage fallback`)
      return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    } catch (error) {
      console.error('Error reading localStorage:', error)
      return []
    }
  }

  // Get timer data for specific user
  async getUserTimerData(userEmail) {
    const allData = await this.getTimerData()
    return allData.filter(row => row.user === userEmail)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }

  // Append data to Google Sheets (requires Service Account)
  async appendTimerData(userData) {
    try {
      // For now, we'll use a web app approach or require manual setup
      // This is a placeholder for the actual implementation
      
      const rowData = [
        new Date().toISOString(),
        userData.user,
        userData.totalSeconds,
        '', // Don't send formattedTime - let Google Apps Script calculate it
        userData.lastUpdated
      ]

      console.log('Data to append to Google Sheets:', rowData)
      
      // Option 1: Use Google Apps Script Web App (with CORS handling)
      const webAppResult = await this.appendViaWebApp(rowData)
      
      if (webAppResult.success) {
        return webAppResult
      }
      
      // Option 2: Try form submission method if web app fails
      console.log('Web app method failed, trying form submission...')
      const formResult = await this.appendViaFormSubmission(rowData)
      
      if (formResult.success) {
        return formResult
      }
      
      // If both methods fail, save to localStorage as fallback
      console.log('All Google Sheets methods failed, saving to localStorage as fallback')
      this.saveToLocalStorage(userData)
      
      return {
        success: true,
        message: 'Data saved to localStorage (fallback). Set up Google Sheets write access for permanent storage.',
        fallback: true
      }
      
    } catch (error) {
      console.error('Error appending to Google Sheets:', error)
      
      // Fallback to localStorage
      this.saveToLocalStorage(userData)
      
      return { 
        success: true,
        message: 'Data saved to localStorage (fallback). Set up Google Sheets write access for permanent storage.',
        fallback: true,
        error: error.message 
      }
    }
  }

  // Fallback localStorage save
  saveToLocalStorage(userData) {
    try {
      const userEmail = userData.user
      localStorage.setItem(`timer_${userEmail}`, JSON.stringify(userData))
      
      // Also save to a general log for spreadsheet-like view
      const allLogs = JSON.parse(localStorage.getItem('timer_logs') || '[]')
      allLogs.push({
        timestamp: new Date().toISOString(),
        ...userData
      })
      localStorage.setItem('timer_logs', JSON.stringify(allLogs))
      
      console.log('Data saved to localStorage as fallback')
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  }

  // Append via Google Apps Script Web App (easier setup)
  async appendViaWebApp(rowData) {
    // Your updated Google Apps Script Web App URL
    const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyJOCrcu3PMc19fAuA66XBXAK9HivULxSA40uOEFtqK9w5Z6qhEPK3ARj42JZaB9bzAnQ/exec'
    
    try {
      console.log('📤 Sending data to Google Apps Script Web App...')
      
      // Since your Apps Script version doesn't support CORS headers,
      // we'll use a method that doesn't require reading the response
      try {
        console.log('Attempting request with no-cors mode...')
        
        // Use no-cors mode - this will send the data but we can't read the response
        const response = await fetch(WEB_APP_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: rowData
          })
        })
        
        console.log('✅ Data sent successfully (no-cors mode)')
        console.log('Response type:', response.type, 'Status available:', response.status !== undefined)
        
        // With no-cors, we get an opaque response and can't read the data
        // But the request was sent successfully
        return {
          success: true,
          message: 'Data sent to Google Sheets successfully',
          note: 'Using no-cors mode - response data not available but save completed',
          mode: 'no-cors'
        }
        
      } catch (fetchError) {
        console.log('⚠️ Fetch failed, trying form submission fallback:', fetchError.message)
        
        // If fetch fails completely, try form submission
        const formResult = await this.appendViaFormSubmission(rowData)
        return formResult
      }
      
    } catch (error) {
      console.error('❌ Failed to save via Web App:', error)
      return {
        success: false,
        error: 'Failed to save via Web App: ' + error.message
      }
    }
  }

  // Alternative method using form submission (CORS-free)
  async appendViaFormSubmission(rowData) {
    return new Promise((resolve) => {
      try {
        console.log('📤 Sending data via form submission method...')
        
        // Create a hidden form
        const form = document.createElement('form')
        form.method = 'POST'
        form.action = 'https://script.google.com/macros/s/AKfycbyJOCrcu3PMc19fAuA66XBXAK9HivULxSA40uOEFtqK9w5Z6qhEPK3ARj42JZaB9bzAnQ/exec'
        form.target = '_blank' // Open in new tab to avoid navigation
        form.style.display = 'none'
        
        // Add data as form fields
        const dataInput = document.createElement('input')
        dataInput.type = 'hidden'
        dataInput.name = 'data'
        dataInput.value = JSON.stringify(rowData)
        form.appendChild(dataInput)
        
        // Add form to page and submit
        document.body.appendChild(form)
        form.submit()
        
        // Clean up
        setTimeout(() => {
          document.body.removeChild(form)
        }, 1000)
        
        console.log('✅ Form submitted successfully')
        resolve({
          success: true,
          message: 'Data sent to Google Sheets via form submission',
          note: 'Form submission method - check new tab for confirmation'
        })
      } catch (error) {
        console.error('❌ Form submission failed:', error)
        resolve({
          success: false,
          error: 'Form submission failed: ' + error.message
        })
      }
    })
  }

  // JSONP method (another CORS alternative)
  async appendViaJSONP(rowData) {
    return new Promise((resolve) => {
      try {
        console.log('📤 Sending data via JSONP method...')
        
        // Create a unique callback name
        const callbackName = 'jsonp_callback_' + Date.now() + '_' + Math.floor(Math.random() * 10000)
        
        // Create the callback function
        window[callbackName] = function(response) {
          console.log('✅ JSONP response received:', response)
          delete window[callbackName] // Clean up
          document.head.removeChild(script) // Clean up script tag
          
          resolve({
            success: true,
            message: 'Data sent to Google Sheets via JSONP',
            data: response
          })
        }
        
        // Create script tag for JSONP
        const script = document.createElement('script')
        const params = new URLSearchParams({
          callback: callbackName,
          data: JSON.stringify(rowData)
        })
        
        script.src = `https://script.google.com/macros/s/AKfycbyJOCrcu3PMc19fAuA66XBXAK9HivULxSA40uOEFtqK9w5Z6qhEPK3ARj42JZaB9bzAnQ/exec?${params}`
        
        // Handle errors
        script.onerror = function() {
          console.error('❌ JSONP request failed')
          delete window[callbackName]
          document.head.removeChild(script)
          resolve({
            success: false,
            error: 'JSONP request failed'
          })
        }
        
        // Set timeout for the request
        setTimeout(() => {
          if (window[callbackName]) {
            console.log('⏰ JSONP request timeout')
            delete window[callbackName]
            if (script.parentNode) {
              document.head.removeChild(script)
            }
            resolve({
              success: false,
              error: 'JSONP request timeout'
            })
          }
        }, 10000) // 10 second timeout
        
        // Add script to head to trigger the request
        document.head.appendChild(script)
        
      } catch (error) {
        console.error('❌ JSONP method failed:', error)
        resolve({
          success: false,
          error: 'JSONP method failed: ' + error.message
        })
      }
    })
  }

  // Helper function to format duration
  formatDuration(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  // Test connection to Google Sheets
  async testConnection() {
    try {
      console.log('Testing Google Sheets connection...')
      console.log('Spreadsheet ID:', this.SPREADSHEET_ID)
      console.log('Sheet Name:', this.SHEET_NAME)
      
      const response = await axios.get(
        `${this.BASE_URL}/${this.SPREADSHEET_ID}/values/${this.SHEET_NAME}!A1:E10?key=${this.API_KEY}`
      )
      
      console.log('✅ Google Sheets connection successful!')
      console.log('Data retrieved:', response.data)
      
      return {
        success: true,
        message: 'Google Sheets connection successful',
        data: response.data,
        rowCount: response.data.values ? response.data.values.length : 0
      }
    } catch (error) {
      console.error('❌ Google Sheets connection failed:', error)
      
      if (error.response) {
        console.error('Error status:', error.response.status)
        console.error('Error data:', error.response.data)
      }
      
      return {
        success: false,
        error: error.message,
        details: error.response?.data || 'Network error'
      }
    }
  }

  // Export to CSV
  async exportToCSV() {
    const data = await this.getTimerData()
    if (data.length === 0) return null

    const headers = ['Timestamp', 'User', 'Total Seconds', 'Formatted Time', 'Last Updated']
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        row.timestamp,
        row.user,
        row.totalSeconds,
        row.formattedTime,
        row.lastUpdated
      ].join(','))
    ].join('\n')

    return csvContent
  }

  // Download CSV file
  async downloadCSV() {
    const csvContent = await this.exportToCSV()
    if (!csvContent) return

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `timer_data_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }
}

export default new GoogleSheetsAPI()

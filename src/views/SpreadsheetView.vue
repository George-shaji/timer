<template>
  <div class="spreadsheet-view">
    <!-- Header -->
    <div class="header">
      <div class="header-content">
        <h1>📊 Time Data Spreadsheet</h1>
        <p>View, filter, and export your timer sessions</p>
      </div>
      <div class="actions">
        <button @click="refreshData" class="action-btn refresh-btn" :disabled="loading">
          <span class="btn-icon">🔄</span>
          <span class="btn-text">{{ loading ? 'Loading...' : 'Refresh' }}</span>
        </button>
        <button @click="exportCSV" class="action-btn export-btn">
          <span class="btn-icon">📁</span>
          <span class="btn-text">Export CSV</span>
        </button>
        <button @click="goToDashboard" class="action-btn back-btn">
          <span class="btn-icon">←</span>
          <span class="btn-text">Back to Timer</span>
        </button>
        <button @click="openGoogleSheet" class="action-btn sheet-btn">
          <span class="btn-icon">📊</span>
          <span class="btn-text">Open Google Sheet</span>
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <div class="filters">
        <div class="filter-group">
          <label>Search User</label>
          <input 
            v-model="searchUser" 
            placeholder="Filter by user email..." 
            class="search-input"
          />
        </div>
        <div class="filter-group">
          <label>Sort By</label>
          <select v-model="sortBy" class="sort-select">
            <option value="timestamp">Sort by Time</option>
            <option value="user">Sort by User</option>
            <option value="totalSeconds">Sort by Duration</option>
          </select>
        </div>
      </div>
      
      <!-- Data Summary -->
      <div class="data-summary">
        <div class="summary-stat">
          <span class="stat-value">{{ filteredData.length }}</span>
          <span class="stat-label">Sessions</span>
        </div>
        <div class="summary-stat">
          <span class="stat-value">{{ totalTimeLogged }}</span>
          <span class="stat-label">Total Time</span>
        </div>
        <div class="summary-stat">
          <span class="stat-value">{{ averageSession }}</span>
          <span class="stat-label">Average</span>
        </div>
      </div>
      
      <!-- Google Sheets Info -->
      <div class="google-sheets-info">
        <div class="sheet-status">
          <span class="status-icon">📊</span>
          <div class="status-details">
            <span class="status-title">Google Sheets Integration</span>
            <span class="status-subtitle">Currently reading data only - manual entry required for writing</span>
          </div>
          <button @click="openGoogleSheet" class="mini-btn">Open Sheet</button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="table-container">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading data...</p>
      </div>
      
      <table v-else-if="filteredData.length > 0" class="spreadsheet-table">
        <thead>
          <tr>
            <th @click="sortBy = 'timestamp'" class="sortable">
              Session Date
              <span class="sort-indicator" v-if="sortBy === 'timestamp'">↓</span>
            </th>
            <th @click="sortBy = 'user'" class="sortable">
              User
              <span class="sort-indicator" v-if="sortBy === 'user'">↓</span>
            </th>
            <th @click="sortBy = 'totalSeconds'" class="sortable">
              Duration (seconds)
              <span class="sort-indicator" v-if="sortBy === 'totalSeconds'">↓</span>
            </th>
            <th @click="sortBy = 'formattedTime'" class="sortable">
              Formatted Time
              <span class="sort-indicator" v-if="sortBy === 'formattedTime'">↓</span>
            </th>
            <th>Session End</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in filteredData" :key="row.timestamp + row.user" class="data-row">
            <td style="color: aliceblue;" class="timestamp-cell">{{ formatTimestamp(row.timestamp) }}</td>
            <td class="user-cell">
              <div class="user-info">
                <div class="user-avatar">{{ row.user.charAt(0).toUpperCase() }}</div>
                <span>{{ row.user }}</span>
              </div>
            </td>
            <td class="duration-cell">{{ row.totalSeconds.toLocaleString() }}</td>
            <td class="time-cell">{{ row.formattedTime }}</td>
            <td class="end-time-cell">{{ formatTimestamp(row.lastUpdated) }}</td>
            <td class="actions-cell">
              <button @click="deleteRow(row)" class="delete-btn" title="Delete session">
                🗑️
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="empty-icon">📊</div>
        <h3>No timer data found</h3>
        <p>Start using the timer to see data here!</p>
        <button @click="goToDashboard" class="action-btn back-btn">
          <span class="btn-icon">←</span>
          <span class="btn-text">Go to Timer</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import sheetsService from '../services/sheetsService.js'

export default {
  name: 'SpreadsheetView',
  data() {
    return {
      data: [],
      searchUser: '',
      sortBy: 'timestamp',
      loading: false
    }
  },
  computed: {
    filteredData() {
      let filtered = this.data
      const user = JSON.parse(localStorage.getItem('userSession') || '{}')
      // Filter by user if search term exists
      if(user.email === "george@gmail.com" ) {
        if (this.searchUser) {
          filtered = filtered.filter(row => 
            row.user.toLowerCase().includes(this.searchUser.toLowerCase())
          )
        }
      }else{
        if (user.email) {
          filtered = filtered.filter(row => 
          row.user.toLowerCase().includes(user.email.toLowerCase())
          )
        }
      }

      // Sort data
      filtered.sort((a, b) => {
        if (this.sortBy === 'timestamp') {
          return new Date(b.timestamp) - new Date(a.timestamp)
        } else if (this.sortBy === 'totalSeconds') {
          return b.totalSeconds - a.totalSeconds
        } else if (this.sortBy === 'user') {
          return a.user.localeCompare(b.user)
        }
        return 0
      })

      return filtered
    },
    totalTimeLogged() {
      const total = this.filteredData.reduce((sum, row) => sum + row.totalSeconds, 0)
      return this.formatDuration(total)
    },
    averageSession() {
      if (this.filteredData.length === 0) return '00:00:00'
      const avg = this.filteredData.reduce((sum, row) => sum + row.totalSeconds, 0) / this.filteredData.length
      return this.formatDuration(Math.floor(avg))
    }
  },
  methods: {
    async refreshData() {
      this.loading = true
      try {
        // Get data from Google Sheets
        const sheetsData = await sheetsService.getTimerData()
        
        // If no sheets data, get from localStorage
        if (sheetsData.length === 0) {
          const localData = this.getLocalStorageData()
          this.data = localData
          console.log('Loaded', this.data.length, 'records from localStorage fallback')
        } else {
          this.data = sheetsData
          console.log('Loaded', this.data.length, 'records from Google Sheets')
        }
      } catch (error) {
        console.error('Error loading data from Google Sheets, trying localStorage:', error)
        this.data = this.getLocalStorageData()
        console.log('Loaded', this.data.length, 'records from localStorage fallback')
      } finally {
        this.loading = false
      }
    },
    
    getLocalStorageData() {
      try {
        const logs = JSON.parse(localStorage.getItem('timer_logs') || '[]')
        return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      } catch (error) {
        console.error('Error reading localStorage:', error)
        return []
      }
    },
    async exportCSV() {
      const csvContent = await sheetsService.exportToCSV()
      if (csvContent) {
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `timer_sessions_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    },
    goToDashboard() {
      this.$router.push({ name: 'Dashboard' })
    },
    formatTimestamp(timestamp) {
      return new Date(timestamp).toLocaleString()
    },
    formatDuration(seconds) {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      const secs = seconds % 60
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    },
    deleteRow(row) {
      if (confirm('Are you sure you want to delete this entry?')) {
        // Note: Deleting from Google Sheets requires additional setup
        // For now, we'll just show a message
        alert('Delete functionality requires Google Sheets API write access. Please delete directly from the Google Sheet.')
        console.log('Delete requested for:', row)
      }
    },
    
    openGoogleSheet() {
      const spreadsheetId = '1C1RhDiWjr1EI29YXfTr_AE_lds5zI3dWR7ed8UH5N1s'
      const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
      window.open(url, '_blank')
    }
  },
  mounted() {
    this.refreshData()
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

.spreadsheet-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #3434e4bb, #242225);
  font-family: 'Inter', sans-serif;
  padding: 20px;
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #3434e4bb, #242225);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.header-content h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
}

.header-content p {
  margin: 4px 0 0 0;
  color: #666;
  font-size: 16px;
}

.actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: 12px;
  font-family: inherit;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.refresh-btn {
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
  box-shadow: 0 4px 16px rgba(40, 167, 69, 0.3);
}

.refresh-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
}

.export-btn {
  background: linear-gradient(135deg, #17a2b8, #20c997);
  color: white;
  box-shadow: 0 4px 16px rgba(23, 162, 184, 0.3);
}

.export-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(23, 162, 184, 0.4);
}

.back-btn {
  background: linear-gradient(135deg, #6c757d, #495057);
  color: white;
  box-shadow: 0 4px 16px rgba(108, 117, 125, 0.3);
}

.back-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(108, 117, 125, 0.4);
}

.sheet-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

.sheet-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

/* Filters Section */
.filters-section {
  background: linear-gradient(135deg, #2b2b7abb, #242225);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.filters {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.filter-group {
  flex: 1;
}

.filter-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.search-input, .sort-select {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  font-size: 14px;
  font-family: inherit;
  background: rgba(255, 255, 255, 0.8);
  transition: all 0.2s ease;
}

.search-input:focus, .sort-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.data-summary {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.summary-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea, #764ba2);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-family: 'Inter', monospace;
}

.stat-label {
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

/* Google Sheets Info */
.google-sheets-info {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.sheet-status {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.2);
}

.status-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.status-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.status-title {
  font-weight: 600;
  color: #f3f2f2;
  font-size: 14px;
}

.status-subtitle {
  font-size: 12px;
  color: #ece5e5;
}

.mini-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mini-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* Table */
.table-container {
  background: linear-gradient(135deg, #5c676dbb, #242225);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 40px;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(102, 126, 234, 0.2);
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.spreadsheet-table {
  width: 100%;
  border-collapse: collapse;
  overflow: hidden;
  border-radius: 12px;
}

.spreadsheet-table th {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  padding: 16px 12px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid rgba(0, 0, 0, 0.1);
  position: relative;
}

.sortable {
  cursor: pointer;
  user-select: none;
  transition: linear-gradient(135deg, #4f3b70, #4605be);
}

.sortable:hover {
  background: linear-gradient(135deg, #50485e, #a4a1a8);
}

.sort-indicator {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: #667eea;
  font-weight: bold;
}

.spreadsheet-table td {
  padding: 16px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  vertical-align: middle;
}

.data-row:hover {
  background: rgba(102, 126, 234, 0.05);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 14px;
}

.time-cell {
  font-family: 'Inter', monospace;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea, #764ba2);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.duration-cell {
  font-family: 'Inter', monospace;
  font-weight: 500;
}

.delete-btn {
  background: linear-gradient(135deg, #dc3545, #c82333);
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.delete-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 60px 20px;
  color: #666;
}

.empty-icon {
  font-size: 64px;
  opacity: 0.5;
}

.empty-state h3 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.empty-state p {
  margin: 0;
  font-size: 16px;
}

/* Responsive */
@media (max-width: 768px) {
  .spreadsheet-view {
    padding: 16px;
  }

  .header {
    flex-direction: column;
    gap: 20px;
    align-items: flex-start;
  }

  .actions {
    width: 100%;
    justify-content: center;
  }

  .filters {
    flex-direction: column;
    gap: 16px;
  }

  .data-summary {
    flex-direction: column;
    gap: 12px;
  }

  .table-container {
    overflow-x: auto;
  }

  .spreadsheet-table {
    min-width: 600px;
  }
}
</style>

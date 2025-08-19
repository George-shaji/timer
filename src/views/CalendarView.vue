<template>
  <div class="calendar-view">
    <!-- Header -->
    <div class="header">
      <h1>Work From Home Calendar</h1>
      <div class="controls">
        <button @click="fetchData" :disabled="loading" class="btn-primary">
          {{ loading ? 'Loading...' : 'Refresh Data' }}
        </button>
        <button @click="exportData" :disabled="!hasData" class="btn-secondary">
          Export CSV
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Fetching data from Sheet2...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-card">
        <h3>❌ Error Loading Data</h3>
        <p>{{ error }}</p>
        <button @click="fetchData" class="btn-primary">Try Again</button>
      </div>
    </div>

    <!-- Data Display -->
    <div v-else-if="hasData" class="data-container fade-in">

      <!-- Week View Table -->
      <div class="week-table-container">
        <h3>Weekly Schedule View</h3>
        <div class="table-wrapper">
        <table class="week-table">
        <thead>
            <tr>
            <th class="row-header">Row</th>
            <th 
                v-for="day in weekDays" 
                :key="`header-${day}`" 
                :class="{ 'today': isToday(day) }" 
                class="day-header"
            >
                {{ day }}
            </th>
            <th 
                v-for="header in nonDayHeaders" 
                :key="`other-${header}`" 
                class="other-header"
            >
                {{ header }}
            </th>
            </tr>
        </thead>
        <tbody>
            <tr 
            v-for="(row, index) in sheetData.data" 
            :key="`row-${index}`"
            :class="[
                { 'highlight-row': index === selectedRow },
                { 'special-row': (index + 1 - 4) % 3 === 0 && index + 1 >= 4 }
            ]"
            >
            <td class="row-index" @click="selectRow(index)">{{ index + 1 }}</td>
            
            <!-- Weekday cells -->
            <td 
                v-for="day in weekDays" 
                :key="`cell-${index}-${day}`" 
                :class="{ 
                'today': isToday(day), 
                'has-data': getCellValue(row, day) && getCellValue(row, day).trim() !== '',
                'has-notes': getDateWithNotes(row, day) && getDateWithNotes(row, day).hasNotes,
                'has-cell-note': getDateWithNotes(row, day) && getDateWithNotes(row, day).hasCellNote
                }" 
                class="day-cell"
            >
                <div class="cell-content" :title="getFullNote(row, day)">
                <div v-if="getDateWithNotes(row, day)" class="date-info">
                    <div class="date-display">
                    📅 {{ getDateWithNotes(row, day).date }}
                    </div>
                    <div class="note-preview" v-if="getDateWithNotes(row, day).hasAssociatedNotes">
                    📝 {{ getAssociatedNotes(row, getDateWithNotes(row, day).date) }}
                    </div>
                </div>
                <div class="empty-state" v-else>
                    -
                </div>
                </div>
            </td>

            <!-- Non-day headers -->
            <td 
                v-for="header in nonDayHeaders" 
                :key="`other-cell-${index}-${header}`" 
                class="other-cell"
            >
                <div class="cell-content">
                {{ row[`${header}_value`] || row[header] || '-' }}
                </div>
            </td>
            </tr>
        </tbody>
        </table>
        </div>
      </div>

      <!-- Selected Row Details -->
      <!-- <div v-if="selectedRowData" class="row-details">
        <h3>Row {{ selectedRow + 1 }} Details</h3>
        <div class="details-grid">
          <div v-for="[key, value] in Object.entries(selectedRowData)" :key="key" class="detail-item">
            <strong>{{ key }}:</strong>
            <span>{{ value || 'Empty' }}</span>
          </div>
        </div>
      </div> -->

      <!-- Raw Data View (Collapsible) -->
      <!-- <div class="raw-data-section">
        <button @click="showRawData = !showRawData" class="btn-secondary">
          {{ showRawData ? 'Hide' : 'Show' }} Raw Data
        </button>
        <div v-if="showRawData" class="raw-data">
          <pre>{{ JSON.stringify(sheetData, null, 2) }}</pre>
        </div>
      </div> -->
    </div>

    <!-- No Data State -->
    <div v-else class="no-data">
      <div class="no-data-card">
        <h3>📄 No Data Found</h3>
        <p>Sheet2 appears to be empty or has no accessible data.</p>
        <button @click="fetchData" class="btn-primary">Check Again</button>
      </div>
    </div>
  </div>
</template>

<script>
import calendarService from '../services/calendarService.js'

export default {
  name: 'CalendarView',
  data() {
    return {
      sheetData: null,
      loading: false,
      error: null,
      selectedRow: null,
      showRawData: false,
      weekDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    }
  },
  computed: {
    hasData() {
      return this.sheetData && this.sheetData.data && this.sheetData.data.length > 0
    },
    selectedRowData() {
      if (this.selectedRow !== null && this.hasData) {
        return this.sheetData.data[this.selectedRow]
      }
      return null
    },
    nonDayHeaders() {
      if (!this.sheetData || !this.sheetData.headers) return []
      return this.sheetData.headers.filter(header => 
        !this.weekDays.some(day => day.toLowerCase() === header.toLowerCase())
      )
    }
  },
  async mounted() {
    await this.fetchData()
  },
  methods: {
    getActualHeaderName(day) {
      if (!this.sheetData || !this.sheetData.headers) return day
      const found = this.sheetData.headers.find(header => 
        header.toLowerCase() === day.toLowerCase()
      )
      return found || day
    },
    getCellValue(row, day) {
      const headerName = this.getActualHeaderName(day)
      // Handle new data structure with value/note objects
      if (row[`${headerName}_value`] !== undefined) {
        const value = row[`${headerName}_value`]
        return typeof value === 'string' ? value : String(value || '')
      }
      // Fallback for backward compatibility
      const fallback = row[headerName]?.value || row[headerName] || ''
      return typeof fallback === 'string' ? fallback : String(fallback || '')
    },
    getCellNote(row, day) {
      const headerName = this.getActualHeaderName(day)
      // Get cell note from new data structure
      if (row[`${headerName}_note`] !== undefined) {
        const note = row[`${headerName}_note`]
        return typeof note === 'string' ? note : String(note || '')
      }
      // Fallback for backward compatibility
      const fallback = row[headerName]?.note || ''
      return typeof fallback === 'string' ? fallback : String(fallback || '')
    },
    hasNotes(row, day) {
      const content = this.getCellValue(row, day)
      return content && content.trim() !== '' && content.trim() !== '-'
    },
    getFullNote(row, day) {
      const content = this.getCellValue(row, day)
      const cellNote = this.getCellNote(row, day)
      
      if (!content || content.trim() === '') return 'No data for this date'
      
      let fullNote = `Date: ${content}`
      
      // Add cell note if it exists
      if (cellNote && cellNote.trim() !== '') {
        fullNote += `\nCell Note: ${cellNote}`
      }
      
      // Add associated notes from Reasons/Leaves
      const associatedNotes = this.getAssociatedNotes(row, content)
      if (associatedNotes) {
        fullNote += `\nNotes: ${associatedNotes}`
      }
      
      return fullNote
    },
    getShortNote(row, day) {
      const content = this.getCellValue(row, day)
      if (!content || content.trim() === '') return ''
      
      return content
    },
    getAssociatedNotes(row, dateContent) {
      // Check if there are notes in the 'Reasons' column for this date
      let reasons = row['Reasons_value'] || row['Reasons'] || row['reasons_value'] || row['reasons'] || ''
      let leaves = row['Leaves_value'] || row['Leaves'] || row['leaves_value'] || row['leaves'] || ''
      
      // Handle cases where values might be objects
      if (typeof reasons === 'object' && reasons !== null) {
        reasons = reasons.value || reasons.toString() || ''
      }
      if (typeof leaves === 'object' && leaves !== null) {
        leaves = leaves.value || leaves.toString() || ''
      }
      
      // Ensure they are strings
      reasons = String(reasons || '')
      leaves = String(leaves || '')
      
      // Combine notes if available
      let notes = []
      if (reasons && reasons.trim() !== '' && reasons.trim() !== '-') {
        notes.push(`Reason: ${reasons}`)
      }
      if (leaves && leaves.trim() !== '' && leaves.trim() !== '-') {
        notes.push(`Leaves: ${leaves}`)
      }
      
      return notes.length > 0 ? notes.join(', ') : ''
    },
    getDateWithNotes(row, day) {
      const dateContent = this.getCellValue(row, day)
      const cellNote = this.getCellNote(row, day)
      
      if (!dateContent || dateContent.trim() === '') return null
      
      const associatedNotes = this.getAssociatedNotes(row, dateContent)
      
      // Combine all notes
      let allNotes = []
      if (cellNote && cellNote.trim() !== '') {
        allNotes.push(`💬 ${cellNote}`)
      }
      if (associatedNotes) {
        allNotes.push(associatedNotes)
      }
      
      return {
        date: dateContent,
        cellNote: cellNote,
        notes: allNotes.join(' | '),
        hasNotes: allNotes.length > 0,
        hasCellNote: cellNote && cellNote.trim() !== '',
        hasAssociatedNotes: associatedNotes !== ''
      }
    },
    async fetchData() {
      this.loading = true
      this.error = null
      try {
        console.log('Fetching Sheet2 data...')
        this.sheetData = await calendarService.fetchDataFromSheet2()
        
        if (!this.sheetData.success) {
          this.error = this.sheetData.error || 'Failed to fetch data'
        } else {
          console.log('Data fetched successfully:', this.sheetData)
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        this.error = err.message || 'An unexpected error occurred'
      } finally {
        this.loading = false
      }
    },
    selectRow(index) {
      this.selectedRow = this.selectedRow === index ? null : index
    },
    getSundayExample() {
      if (this.hasData && this.sheetData.data[0]) {
        const headerName = this.getActualHeaderName('Sunday')
        return this.getCellValue(this.sheetData.data[0], 'Sunday') || 'No Sunday data'
      }
      return 'No data available'
    },
    getFridayExample() {
      if (this.hasData && this.sheetData.data[0]) {
        const headerName = this.getActualHeaderName('Friday')
        return this.getCellValue(this.sheetData.data[0], 'Friday') || 'No Friday data'
      }
      return 'No data available'
    },
    getMondayExample() {
      if (this.hasData && this.sheetData.data[0]) {
        const headerName = this.getActualHeaderName('Monday')
        return this.getCellValue(this.sheetData.data[0], 'Monday') || 'No Monday data'
      }
      return 'No data available'
    },
    getWednesdayExample() {
      if (this.hasData && this.sheetData.data[0]) {
        const headerName = this.getActualHeaderName('Wednesday')
        return this.getCellValue(this.sheetData.data[0], 'Wednesday') || 'No Wednesday data'
      }
      return 'No data available'
    },
    isToday(day) {
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
      return today === day
    },
    async exportData() {
      if (!this.hasData) return
      
      try {
        const csvContent = this.convertToCSV()
        this.downloadCSV(csvContent)
      } catch (err) {
        console.error('Export failed:', err)
        alert('Failed to export data')
      }
    },
    convertToCSV() {
      if (!this.hasData) return ''
      
      const headers = this.sheetData.headers
      const rows = this.sheetData.data
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => 
          headers.map(header => {
            // Handle new data structure with _value suffix
            const value = row[`${header}_value`] || row[header] || ''
            const stringValue = typeof value === 'string' ? value : String(value || '')
            return `"${stringValue.replace(/"/g, '""')}"`
          }).join(',')
        )
      ].join('\n')
      
      return csvContent
    },
    downloadCSV(csvContent) {
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sheet2_data_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    }
  }
}
</script>

<style scoped>
.calendar-view {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  position: relative;
  font-weight: 400;
}

.calendar-view::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(circle at 25% 25%, rgba(139, 69, 19, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, rgba(255, 20, 147, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(30, 144, 255, 0.1) 0%, transparent 50%);
  z-index: -1;
  animation: gradientShift 15s ease-in-out infinite;
}

@keyframes gradientShift {
  0%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.05);
  }
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding: 28px 36px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.header:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 
    0 25px 70px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.header h1 {
  color: white;
  margin: 0;
  font-weight: 700;
  font-size: 2.2rem;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  letter-spacing: -0.5px;
}

.controls {
  display: flex;
  gap: 15px;
  align-items: center;
}

.controls .btn-primary,
.controls .btn-secondary {
  min-width: 140px;
}

.btn-primary, .btn-secondary {
  padding: 14px 28px;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  text-transform: none;
  letter-spacing: 0.3px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  box-shadow: 
    0 8px 25px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.btn-primary {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%);
  color: #667eea;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.btn-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.2), transparent);
  transition: left 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  transform: translateY(-3px);
  box-shadow: 
    0 15px 40px rgba(102, 126, 234, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.btn-primary:hover:not(:disabled)::before {
  left: 100%;
}

.btn-primary:disabled {
  background: rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.6);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-secondary {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.btn-secondary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-secondary:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.2) 100%);
  transform: translateY(-3px);
  box-shadow: 
    0 15px 40px rgba(255, 255, 255, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.btn-secondary:hover:not(:disabled)::before {
  left: 100%;
}

.loading {
  text-align: center;
  padding: 80px 20px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 24px;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.2));
}

.loading p {
  color: white;
  font-size: 1.1rem;
  font-weight: 500;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-in .stat-card {
  animation: fadeIn 1s cubic-bezier(0.4, 0, 0.2, 1) both;
}

.fade-in .week-table-container {
  animation: fadeIn 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.3s both;
}

.error-state, .no-data {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.error-card, .no-data-card {
  text-align: center;
  padding: 48px 36px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  max-width: 480px;
  color: white;
}

.error-card h3, .no-data-card h3 {
  color: white;
  margin-bottom: 16px;
  font-size: 1.5rem;
  font-weight: 600;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.error-card p, .no-data-card p {
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 24px;
  font-size: 1rem;
  line-height: 1.6;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 24px;
  margin-bottom: 30px;
}

.stat-card {
  text-align: center;
  padding: 32px 24px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%);
  color: white;
  border-radius: 24px;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.stat-card:hover {
  transform: translateY(-8px);
  box-shadow: 
    0 30px 80px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 100%);
}

.stat-card:hover::before {
  opacity: 1;
}

.stat-card h3 {
  margin: 0;
  font-size: 2.8rem;
  font-weight: 800;
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  letter-spacing: -1px;
}

.stat-card p {
  margin: 0;
  opacity: 0.95;
  font-weight: 500;
  font-size: 1rem;
  text-transform: capitalize;
  letter-spacing: 0.3px;
  position: relative;
  z-index: 1;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.quick-access-demo {
  margin-bottom: 32px;
  padding: 32px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.quick-access-demo:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 25px 70px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.quick-access-demo h3 {
  margin-bottom: 24px;
  color: white;
  font-weight: 700;
  font-size: 1.5rem;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.access-examples {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-top: 24px;
}

.example-card {
  padding: 24px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(15px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.example-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  background: rgba(255, 255, 255, 0.25);
}

.example-card h4 {
  margin: 0 0 18px;
  color: white;
  font-weight: 600;
  font-size: 1.1rem;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.example-card code {
  display: block;
  background: rgba(0, 0, 0, 0.2);
  padding: 14px 18px;
  border-radius: 12px;
  font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', 'Courier New', monospace;
  font-size: 0.9rem;
  margin-bottom: 18px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  backdrop-filter: blur(10px);
}

.example-card .result {
  padding: 14px 18px;
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.3) 0%, rgba(139, 195, 74, 0.3) 100%);
  border: 1px solid rgba(76, 175, 80, 0.5);
  border-radius: 12px;
  font-weight: 600;
  color: #e8f5e8;
  border-left: 4px solid #4caf50;
  backdrop-filter: blur(10px);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.week-table-container {
  margin-bottom: 30px;
}

.table-wrapper {
  overflow-x: auto;
  border-radius: 20px;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.table-wrapper:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 25px 70px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.week-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: transparent;
  font-size: 0.95rem;
  table-layout: auto;
}

.week-table th,
.week-table td {
  padding: 18px 14px;
  text-align: left;
  border: none;
  position: relative;
  overflow: visible;
  word-wrap: break-word;
  white-space: nowrap;
}

.week-table th:first-child,
.week-table td:first-child {
  width: 70px;
  text-align: center;
  min-width: 70px;
  max-width: 70px;
}

.week-table th:not(:first-child),
.week-table td:not(:first-child) {
  width: auto;
  min-width: 120px;
  text-align: center;
}

.week-table th.row-header {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.6) 100%);
  color: white;
  font-weight: 700;
  width: 70px;
  min-width: 70px;
  max-width: 70px;
  text-align: center;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.week-table th.day-header {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.2) 100%);
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: capitalize;
  letter-spacing: 0.3px;
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 2px solid rgba(255, 255, 255, 0.2);
  vertical-align: middle;
  white-space: nowrap;
  width: 120px;
  min-width: 120px;
  text-align: center;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
}

.week-table th.other-header {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%);
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: capitalize;
  letter-spacing: 0.3px;
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 2px solid rgba(255, 255, 255, 0.2);
  vertical-align: middle;
  white-space: nowrap;
  width: 110px;
  min-width: 110px;
  text-align: center;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
}

.week-table td.day-cell {
  vertical-align: top;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  width: 120px;
  min-width: 120px;
  max-width: 120px;
  text-align: center;
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.week-table td.other-cell {
  vertical-align: top;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  width: 110px;
  min-width: 110px;
  text-align: center;
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.week-table th:first-child {
  border-top-left-radius: 20px;
}

.week-table th:last-child {
  border-top-right-radius: 20px;
}

.week-table th.day-header.today {
  background: linear-gradient(135deg, #ff6b6b 0%, #ffa726 100%);
  color: white;
  box-shadow: 0 0 25px rgba(255, 107, 107, 0.4);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 25px rgba(255, 107, 107, 0.4);
  }
  50% {
    box-shadow: 0 0 35px rgba(255, 107, 107, 0.6);
  }
}

.week-table td.day-cell.today {
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.2) 0%, rgba(255, 167, 38, 0.2) 100%);
  border-left: 4px solid #ff6b6b;
  position: relative;
  animation: glow 3s ease-in-out infinite;
}

@keyframes glow {
  0%, 100% {
    box-shadow: inset 0 0 20px rgba(255, 107, 107, 0.2);
  }
  50% {
    box-shadow: inset 0 0 30px rgba(255, 107, 107, 0.3);
  }
}

.week-table td.day-cell.today::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.1) 0%, rgba(255, 167, 38, 0.1) 100%);
  border-radius: 10px;
  margin: 4px;
  z-index: -1;
}

.week-table td.day-cell.has-data {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(139, 195, 74, 0.15) 100%);
  border-left: 3px solid #4caf50;
  font-weight: 500;
}

.week-table td.day-cell.has-data .cell-content {
  color: #e8f5e8;
  font-weight: 600;
}

.week-table td.day-cell.has-notes {
  background: linear-gradient(135deg, rgba(33, 150, 243, 0.15) 0%, rgba(30, 136, 229, 0.15) 100%);
  border-left: 3px solid #2196f3;
  font-weight: 500;
}

.week-table td.day-cell.has-notes .cell-content {
  color: #e3f2fd;
  font-weight: 600;
}

.week-table td.day-cell.has-cell-note {
  background: linear-gradient(135deg, rgba(156, 39, 176, 0.15) 0%, rgba(142, 36, 170, 0.15) 100%);
  border-left: 3px solid #9c27b0;
  font-weight: 500;
}

.week-table td.day-cell.has-cell-note .cell-content {
  color: #f3e5f5;
  font-weight: 600;
}

.date-display {
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 6px;
  color: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.date-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.note-preview {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(33, 150, 243, 0.3);
  padding: 4px 10px;
  border-radius: 8px;
  margin-top: 6px;
  border: 1px solid rgba(33, 150, 243, 0.4);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
  backdrop-filter: blur(5px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.cell-note-preview {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(156, 39, 176, 0.3);
  padding: 4px 10px;
  border-radius: 8px;
  margin-top: 6px;
  border: 1px solid rgba(156, 39, 176, 0.4);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
  font-style: italic;
  backdrop-filter: blur(5px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.empty-state {
  color: rgba(255, 255, 255, 0.4);
  font-style: italic;
  font-size: 0.9rem;
}

.week-table tbody tr {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.week-table tbody tr:hover {
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.week-table tbody tr:last-child td:first-child {
  border-bottom-left-radius: 20px;
}

.week-table tbody tr:last-child td:last-child {
  border-bottom-right-radius: 20px;
}

.week-table td:last-child {
  border-right: none;
}

.row-index {
  cursor: pointer;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%) !important;
  font-weight: 700;
  text-align: center !important;
  color: white;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 12px;
  margin: 3px;
  vertical-align: middle;
  min-width: 60px;
  max-width: 70px;
  position: relative;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.row-index:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%) !important;
  color: #667eea;
  transform: scale(1.08);
  box-shadow: 0 8px 25px rgba(255, 255, 255, 0.3);
  text-shadow: none;
}

.highlight-row {
  background: linear-gradient(90deg, rgba(255, 193, 7, 0.25) 0%, rgba(255, 235, 59, 0.25) 100%) !important;
  border-left: 4px solid #ffc107;
  box-shadow: 0 4px 15px rgba(255, 193, 7, 0.3);
}

.highlight-row td {
  border-bottom: 1px solid rgba(255, 193, 7, 0.4);
}

.cell-content {
  min-height: 36px;
  word-break: break-word;
  line-height: 1.5;
  padding: 10px 12px;
  border-radius: 10px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  box-sizing: border-box;
  text-align: center;
  overflow: hidden;
  backdrop-filter: blur(8px);
}

.cell-content:not(:empty) {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.cell-content:hover:not(:empty) {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.05);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  overflow: visible;
  z-index: 15;
  white-space: normal;
  min-height: auto;
  max-height: none;
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.row-details {
  margin-bottom: 32px;
  padding: 32px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.row-details:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 25px 70px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.row-details h3 {
  margin-bottom: 24px;
  color: white;
  font-weight: 700;
  font-size: 1.5rem;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-top: 24px;
}

.detail-item {
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border-left: 4px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.detail-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
  border-left-color: white;
  background: rgba(255, 255, 255, 0.25);
}

.detail-item strong {
  display: block;
  color: white;
  margin-bottom: 10px;
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: capitalize;
  letter-spacing: 0.3px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.detail-item span {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  line-height: 1.5;
}

.raw-data-section {
  margin-top: 32px;
}

.raw-data {
  margin-top: 18px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 28px;
  overflow-x: auto;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.raw-data:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
  box-shadow: 
    0 25px 70px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.raw-data pre {
  margin: 0;
  font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

@media (max-width: 768px) {
  .calendar-view {
    padding: 16px;
  }
  
  .header {
    flex-direction: column;
    gap: 20px;
    text-align: center;
    padding: 24px 28px;
  }
  
  .header h1 {
    font-size: 1.8rem;
  }
  
  .controls {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .btn-primary, .btn-secondary {
    padding: 12px 20px;
    font-size: 0.9rem;
    min-width: 120px;
  }
  
  .stats-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .access-examples {
    grid-template-columns: 1fr;
  }
  
  .table-wrapper {
    border-radius: 16px;
  }
  
  .week-table th:first-child {
    border-top-left-radius: 16px;
  }
  
  .week-table th:last-child {
    border-top-right-radius: 16px;
  }
  
  .week-table tbody tr:last-child td:first-child {
    border-bottom-left-radius: 16px;
  }
  
  .week-table tbody tr:last-child td:last-child {
    border-bottom-right-radius: 16px;
  }
  
  .details-grid {
    grid-template-columns: 1fr;
  }
}

/* Row clicked highlight */
.highlight-row {
  background-color: rgba(255, 193, 7, 0.25) !important;
}

/* Every 3rd row starting from row 4 (4,7,10,...) */
.special-row {
  background-color: rgba(240, 205, 10, 0.15) !important;
}

.highlight-row td:last-child,
.special-row td:last-child {
  background-color: transparent !important;
}

/* Additional modern touches */
.week-table-container h3 {
  color: white;
  font-weight: 700;
  font-size: 1.4rem;
  margin-bottom: 20px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

/* Smooth scrollbar styling */
.table-wrapper::-webkit-scrollbar {
  height: 8px;
}

.table-wrapper::-webkit-scrollbar-track {
  background: rgba(184, 28, 28, 0.1);
  border-radius: 10px;
}

.table-wrapper::-webkit-scrollbar-thumb {
  background: rgba(189, 4, 4, 0.3);
  border-radius: 10px;
  transition: background 0.3s ease;
}

.table-wrapper::-webkit-scrollbar-thumb:hover {
  background: rgba(250, 0, 0, 0.5);
}
</style>

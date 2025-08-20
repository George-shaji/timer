<template>
  <div class="monthly-report-view">
    <!-- Header -->
    <div class="header">
      <div class="header-content">
        <h1>📊 Monthly Report</h1>
        <p>Generate and view detailed monthly timer reports</p>
      </div>
      <div class="actions">
        <button @click="goBack" class="action-btn back-btn">
          <span class="btn-icon">←</span>
          <span class="btn-text">Back</span>
        </button>
      </div>
    </div>

    <!-- Report Controls -->
    <div class="report-controls">
      <div class="month-selector">
        <label>Select Month:</label>
        <select v-model="selectedMonth" class="month-select">
          <option v-for="month in availableMonths" :key="month.value" :value="month.value">
            {{ month.label }}
          </option>
        </select>
      </div>
      <button @click="generateReport" :disabled="loading" class="generate-btn">
        <span class="btn-icon">{{ loading ? '⏳' : '📈' }}</span>
        <span class="btn-text">{{ loading ? 'Generating...' : 'Generate Report' }}</span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Generating monthly report...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>Error Loading Data</h3>
      <p>{{ error }}</p>
      <button @click="generateReport" class="retry-btn">Try Again</button>
    </div>

    <!-- Report Results -->
    <div v-else-if="reportData" class="report-results">
      <!-- Individual Person Reports -->
      <div class="person-reports">
        <div class="section-header">
          <h2>Individual Person Reports</h2>
          <div class="access-indicator">
            <span v-if="isAdmin" class="admin-badge">
              <span class="badge-icon">👑</span>
              <span class="badge-text">Admin View - All Users</span>
            </span>
            <span v-else class="user-badge">
              <span class="badge-icon">👤</span>
              <span class="badge-text">Personal View - {{ currentUser }}</span>
            </span>
          </div>
        </div>
        <div class="person-cards">
          <div v-if="reportData.personReports.length === 0" class="no-data-message">
            <div class="no-data-icon">📊</div>
            <h3>No Data Available</h3>
            <p v-if="isAdmin">No timer data found for any users in {{ getMonthLabel(selectedMonth) }}</p>
            <p v-else>No timer data found for your account in {{ getMonthLabel(selectedMonth) }}</p>
          </div>
          <div v-for="person in reportData.personReports" :key="person.email" class="person-card">
            <div class="person-header">
              <div class="person-info">
                <div class="person-avatar">{{ person.email.charAt(0).toUpperCase() }}</div>
                <div class="person-details">
                  <h3>{{ person.email }}</h3>
                  <p>{{ person.totalSessions }} sessions • {{ person.totalTimeFormatted }}</p>
                </div>
              </div>
              <div class="person-stats">
                <div class="stat-item">
                  <span class="stat-label">Avg/Day</span>
                  <span class="stat-value">{{ person.averageDailyFormatted }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Longest</span>
                  <span class="stat-value">{{ person.longestSessionFormatted }}</span>
                </div>
              </div>
            </div>
            
            <!-- Person's Daily Breakdown -->
            <div class="person-daily-breakdown">
              <h4>Daily Time Log</h4>
              <div class="daily-grid">
                <div v-for="day in person.dailyBreakdown" :key="day.date" class="daily-item">
                  <div class="daily-date">{{ formatShortDate(day.date) }}</div>
                  <div class="daily-sessions">{{ day.sessions }} sessions</div>
                  <div class="daily-time">{{ day.totalTimeFormatted }}</div>
                  <div class="daily-bar">
                    <div 
                      class="daily-bar-fill" 
                      :style="{ width: (day.totalSeconds / person.maxDaySeconds * 100) + '%' }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Weekly Summary for Person -->
            <div class="person-weekly-summary">
              <h4>Weekly Summary</h4>
              <div class="weekly-grid">
                <div v-for="week in person.weeklyBreakdown" :key="week.weekStart" class="weekly-item">
                  <div class="week-label">Week {{ week.weekNumber }}</div>
                  <div class="week-range">{{ formatWeekRange(week.weekStart, week.weekEnd) }}</div>
                  <div class="week-stats">
                    <span class="week-sessions">{{ week.sessions }} sessions</span>
                    <span class="week-time">{{ week.totalTimeFormatted }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Export Options -->
      <div class="export-options">
        <button @click="exportReport" class="export-btn">
          <span class="btn-icon">📁</span>
          <span class="btn-text">Export to CSV</span>
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <div class="empty-icon">📊</div>
      <h3>No Report Generated</h3>
      <p>Click "Generate Report" to create your monthly report</p>
    </div>
  </div>
</template>

<script>
import sheetsService from '../services/sheetsService.js'

export default {
  name: 'MonthlyReportView',
  data() {
    return {
      loading: false,
      error: null,
      reportData: null,
      selectedMonth: new Date().toISOString().slice(0, 7), // Current month (YYYY-MM)
      availableMonths: []
    }
  },
  computed: {
    currentUser() {
      return localStorage.getItem('currentUser') || ''
    },
    isAdmin() {
      return this.currentUser === 'george@gmail.com'
    }
  },
  methods: {
    async generateReport() {
      this.loading = true
      this.error = null
      this.reportData = null

      try {
        console.log(`Generating monthly report for ${this.selectedMonth}`)
        
        // Get data from sheets service
        const timerData = await sheetsService.getTimerData()
        
        if (!timerData || timerData.length === 0) {
          throw new Error('No timer data available')
        }

        // Filter data for selected month
        const monthData = this.filterDataByMonth(timerData, this.selectedMonth)
        
        if (monthData.length === 0) {
          throw new Error(`No data found for ${this.getMonthLabel(this.selectedMonth)}`)
        }

        // For non-admin users, filter data to only include their sessions
        let filteredData = monthData
        if (!this.isAdmin) {
          filteredData = monthData.filter(session => session.user === this.currentUser)
          if (filteredData.length === 0) {
            throw new Error(`No data found for your account in ${this.getMonthLabel(this.selectedMonth)}`)
          }
        }

        // Generate report statistics
        this.reportData = this.generateReportStatistics(filteredData)
        
        console.log('Monthly report generated successfully:', this.reportData)
        
      } catch (error) {
        console.error('Error generating monthly report:', error)
        this.error = error.message || 'Failed to generate report'
      } finally {
        this.loading = false
      }
    },

    filterDataByMonth(data, monthStr) {
      const [year, month] = monthStr.split('-')
      return data.filter(session => {
        const sessionDate = new Date(session.timestamp)
        return sessionDate.getFullYear() === parseInt(year) && 
               (sessionDate.getMonth() + 1) === parseInt(month)
      })
    },

    generateReportStatistics(data) {
      const totalSessions = data.length
      const totalSeconds = data.reduce((sum, session) => sum + session.totalSeconds, 0)
      const averageSeconds = totalSeconds / totalSessions

      // Group by day
      const dailyData = {}
      data.forEach(session => {
        const date = new Date(session.timestamp).toISOString().split('T')[0]
        if (!dailyData[date]) {
          dailyData[date] = { sessions: 0, totalSeconds: 0 }
        }
        dailyData[date].sessions++
        dailyData[date].totalSeconds += session.totalSeconds
      })

      // Create daily breakdown
      const dailyBreakdown = Object.entries(dailyData)
        .map(([date, stats]) => ({
          date,
          sessions: stats.sessions,
          totalTimeFormatted: this.formatDuration(stats.totalSeconds),
          averageFormatted: this.formatDuration(Math.floor(stats.totalSeconds / stats.sessions))
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date))

      // Generate individual person reports
      const personReports = this.generatePersonReports(data)

      return {
        totalSessions,
        totalTimeFormatted: this.formatDuration(totalSeconds),
        averageSessionFormatted: this.formatDuration(Math.floor(averageSeconds)),
        activeDays: Object.keys(dailyData).length,
        dailyBreakdown,
        personReports
      }
    },

    generatePersonReports(data) {
      // Group data by person
      const personData = {}
      data.forEach(session => {
        if (!personData[session.user]) {
          personData[session.user] = []
        }
        personData[session.user].push(session)
      })

      // Filter by user permissions
      let filteredPersonData = personData
      if (!this.isAdmin) {
        // Non-admin users can only see their own data
        filteredPersonData = {}
        if (personData[this.currentUser]) {
          filteredPersonData[this.currentUser] = personData[this.currentUser]
        }
      }

      return Object.entries(filteredPersonData).map(([email, sessions]) => {
        const totalSessions = sessions.length
        const totalSeconds = sessions.reduce((sum, session) => sum + session.totalSeconds, 0)
        const longestSession = Math.max(...sessions.map(s => s.totalSeconds))

        // Group by day for this person
        const dailyData = {}
        sessions.forEach(session => {
          const date = new Date(session.timestamp).toISOString().split('T')[0]
          if (!dailyData[date]) {
            dailyData[date] = { sessions: 0, totalSeconds: 0 }
          }
          dailyData[date].sessions++
          dailyData[date].totalSeconds += session.totalSeconds
        })

        // Create daily breakdown for this person
        const dailyBreakdown = Object.entries(dailyData)
          .map(([date, stats]) => ({
            date,
            sessions: stats.sessions,
            totalSeconds: stats.totalSeconds,
            totalTimeFormatted: this.formatDuration(stats.totalSeconds)
          }))
          .sort((a, b) => new Date(a.date) - new Date(b.date))

        // Find max day seconds for bar chart scaling
        const maxDaySeconds = Math.max(...dailyBreakdown.map(d => d.totalSeconds))

        // Generate weekly breakdown
        const weeklyBreakdown = this.generateWeeklyBreakdown(dailyBreakdown)

        return {
          email,
          totalSessions,
          totalSeconds,
          totalTimeFormatted: this.formatDuration(totalSeconds),
          averageDailyFormatted: this.formatDuration(Math.floor(totalSeconds / Object.keys(dailyData).length)),
          longestSessionFormatted: this.formatDuration(longestSession),
          dailyBreakdown,
          maxDaySeconds,
          weeklyBreakdown
        }
      }).sort((a, b) => b.totalSeconds - a.totalSeconds) // Sort by total time descending
    },

    generateWeeklyBreakdown(dailyBreakdown) {
      const weeks = {}
      
      dailyBreakdown.forEach(day => {
        const date = new Date(day.date)
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay()) // Start of week (Sunday)
        const weekKey = weekStart.toISOString().split('T')[0]
        
        if (!weeks[weekKey]) {
          const weekEnd = new Date(weekStart)
          weekEnd.setDate(weekStart.getDate() + 6)
          weeks[weekKey] = {
            weekStart: weekStart.toISOString().split('T')[0],
            weekEnd: weekEnd.toISOString().split('T')[0],
            sessions: 0,
            totalSeconds: 0
          }
        }
        
        weeks[weekKey].sessions += day.sessions
        weeks[weekKey].totalSeconds += day.totalSeconds
      })

      return Object.entries(weeks)
        .map(([weekKey, stats], index) => ({
          weekNumber: index + 1,
          weekStart: stats.weekStart,
          weekEnd: stats.weekEnd,
          sessions: stats.sessions,
          totalTimeFormatted: this.formatDuration(stats.totalSeconds)
        }))
        .sort((a, b) => new Date(a.weekStart) - new Date(b.weekStart))
    },

    formatDuration(seconds) {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      const secs = seconds % 60
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    },

    formatDate(dateStr) {
      return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })
    },

    formatShortDate(dateStr) {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    },

    formatWeekRange(startDate, endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      if (start.getMonth() === end.getMonth()) {
        return `${start.toLocaleDateString('en-US', { month: 'short' })} ${start.getDate()}-${end.getDate()}`
      } else {
        return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      }
    },

    getMonthLabel(monthStr) {
      const [year, month] = monthStr.split('-')
      return new Date(year, month - 1).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      })
    },

    generateAvailableMonths() {
      const months = []
      const now = new Date()
      
      // Generate last 12 months
      for (let i = 0; i < 12; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const year = date.getFullYear()
        const month = (date.getMonth() + 1).toString().padStart(2, '0') // Add 1 to fix 0-indexed months
        const value = `${year}-${month}`
        const label = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long'
        })
        months.push({ value, label })
      }
      
      this.availableMonths = months
    },

    async exportReport() {
      if (!this.reportData) return

      try {
        const csvContent = this.generateCSV()
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        
        // Generate filename with user context
        const userContext = this.isAdmin ? 'admin_all_users' : this.currentUser.replace('@', '_at_')
        a.download = `monthly_report_${this.selectedMonth}_${userContext}.csv`
        
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } catch (error) {
        console.error('Error exporting report:', error)
      }
    },

    generateCSV() {
      const monthLabel = this.getMonthLabel(this.selectedMonth)
      const userContext = this.isAdmin ? 'All Users' : this.currentUser
      
      const headers = ['Date', 'Sessions', 'Total Time', 'Average Session']
      const rows = this.reportData.dailyBreakdown.map(day => [
        this.formatDate(day.date),
        day.sessions,
        day.totalTimeFormatted,
        day.averageFormatted
      ])

      // Add individual person data
      const personData = []
      this.reportData.personReports.forEach(person => {
        personData.push([])
        personData.push([`Individual Report - ${person.email}`])
        personData.push([`Total Sessions: ${person.totalSessions}`])
        personData.push([`Total Time: ${person.totalTimeFormatted}`])
        personData.push([`Average Daily: ${person.averageDailyFormatted}`])
        personData.push([`Longest Session: ${person.longestSessionFormatted}`])
        personData.push([])
        personData.push(['Date', 'Sessions', 'Time'])
        
        person.dailyBreakdown.forEach(day => {
          personData.push([
            this.formatDate(day.date),
            day.sessions,
            day.totalTimeFormatted
          ])
        })
        personData.push([])
      })

      const csvContent = [
        `Monthly Report - ${monthLabel}`,
        `View: ${userContext}`,
        `Generated: ${new Date().toLocaleString()}`,
        '',
        `Total Sessions: ${this.reportData.totalSessions}`,
        `Total Time: ${this.reportData.totalTimeFormatted}`,
        `Average Session: ${this.reportData.averageSessionFormatted}`,
        `Active Days: ${this.reportData.activeDays}`,
        '',
        'DAILY BREAKDOWN',
        headers.join(','),
        ...rows.map(row => row.join(',')),
        '',
        'INDIVIDUAL REPORTS',
        ...personData.map(row => Array.isArray(row) ? row.join(',') : row)
      ].join('\n')

      return csvContent
    },

    goBack() {
      this.$router.go(-1)
    }
  },

  mounted() {
    this.generateAvailableMonths()
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

.monthly-report-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea, #764ba2);
  font-family: 'Inter', sans-serif;
  padding: 20px;
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
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
  color: white;
}

.header-content p {
  margin: 4px 0 0 0;
  color: rgba(255, 255, 255, 0.8);
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

.back-btn {
  background: linear-gradient(135deg, #6c757d, #495057);
  color: white;
  box-shadow: 0 4px 16px rgba(108, 117, 125, 0.3);
}

.back-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(108, 117, 125, 0.4);
}

/* Report Controls */
.report-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.month-selector {
  display: flex;
  align-items: center;
  gap: 12px;
}

.month-selector label {
  color: white;
  font-weight: 500;
  font-size: 14px;
}

.month-select {
  padding: 10px 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-family: inherit;
  font-size: 14px;
  backdrop-filter: blur(10px);
}

.month-select option {
  background: #333;
  color: white;
}

.generate-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
  border: none;
  border-radius: 12px;
  font-family: inherit;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 16px rgba(40, 167, 69, 0.3);
}

.generate-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
}

.generate-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 60px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  color: white;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 60px;
  background: rgba(220, 53, 69, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(220, 53, 69, 0.3);
  text-align: center;
}

.error-icon {
  font-size: 48px;
}

.error-state h3 {
  margin: 0;
  color: white;
  font-size: 24px;
}

.error-state p {
  margin: 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
}

.retry-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #dc3545, #c82333);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  font-weight: 500;
  transition: all 0.2s ease;
}

.retry-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
}

/* Report Results */
.report-results {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.report-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.summary-icon {
  font-size: 32px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
  border-radius: 12px;
}

.summary-content h3 {
  margin: 0 0 4px 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-value {
  margin: 0;
  color: white;
  font-size: 24px;
  font-weight: 700;
  font-family: 'Inter', monospace;
}

/* Daily Breakdown */
.daily-breakdown {
  margin-bottom: 32px;
}

.daily-breakdown h2 {
  color: white;
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 16px 0;
}

.breakdown-table {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  overflow: hidden;
}

.breakdown-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1.5fr 1.5fr;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.1);
  font-weight: 600;
  color: white;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.breakdown-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1.5fr 1.5fr;
  gap: 16px;
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
  transition: background-color 0.2s ease;
}

.breakdown-row:hover {
  background: rgba(255, 255, 255, 0.05);
}

.breakdown-row:last-child {
  border-bottom: none;
}

.time-cell, .avg-cell {
  font-family: 'Inter', monospace;
  font-weight: 500;
}

/* Export Options */
.export-options {
  display: flex;
  justify-content: center;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #17a2b8, #20c997);
  color: white;
  border: none;
  border-radius: 12px;
  font-family: inherit;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 16px rgba(23, 162, 184, 0.3);
}

.export-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(23, 162, 184, 0.4);
}

/* Individual Person Reports */
.person-reports {
  margin-bottom: 32px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.person-reports h2 {
  color: white;
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.person-reports h2::before {
  content: "👥";
  font-size: 18px;
}

.access-indicator {
  display: flex;
  align-items: center;
}

.admin-badge, .user-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.admin-badge {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #1a1a1a;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
}

.user-badge {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.badge-icon {
  font-size: 14px;
}

.badge-text {
  font-size: 11px;
}

.person-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.no-data-message {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 60px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  text-align: center;
}

.no-data-icon {
  font-size: 48px;
  opacity: 0.7;
}

.no-data-message h3 {
  margin: 0;
  color: white;
  font-size: 20px;
  font-weight: 600;
}

.no-data-message p {
  margin: 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  max-width: 300px;
}

.person-card {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  overflow: hidden;
}

.person-card:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.person-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
}

.person-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.person-avatar {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 16px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.person-details h3 {
  margin: 0;
  color: white;
  font-size: 16px;
  font-weight: 600;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.person-details p {
  margin: 2px 0 0 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
}

.person-stats {
  display: flex;
  gap: 16px;
  flex-shrink: 0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 60px;
}

.stat-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

.stat-value {
  font-size: 13px;
  color: white;
  font-weight: 600;
  font-family: 'Inter', monospace;
}

/* Person's Daily Breakdown - Compact Version */
.person-daily-breakdown {
  margin-bottom: 16px;
}

.person-daily-breakdown h4 {
  color: white;
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.person-daily-breakdown h4::before {
  content: "📅";
  font-size: 12px;
}

.daily-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
  padding: 2px;
}

.daily-grid::-webkit-scrollbar {
  width: 4px;
}

.daily-grid::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.daily-grid::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.daily-item {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 8px 6px;
  text-align: center;
  transition: all 0.2s ease;
  cursor: pointer;
}

.daily-item:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: scale(1.02);
}

.daily-date {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 600;
  margin-bottom: 3px;
}

.daily-sessions {
  font-size: 8px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 2px;
}

.daily-time {
  font-size: 11px;
  color: white;
  font-weight: 600;
  font-family: 'Inter', monospace;
  margin-bottom: 6px;
}

.daily-bar {
  height: 3px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
  overflow: hidden;
}

.daily-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 2px;
  transition: width 0.3s ease;
}

/* Weekly Summary - Compact Version */
.person-weekly-summary h4 {
  color: white;
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.person-weekly-summary h4::before {
  content: "📊";
  font-size: 12px;
}

.weekly-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 8px;
}

.weekly-item {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 10px;
  transition: all 0.2s ease;
}

.weekly-item:hover {
  background: rgba(255, 255, 255, 0.15);
}

.week-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.week-range {
  font-size: 11px;
  color: white;
  margin: 2px 0 6px 0;
  font-weight: 500;
}

.week-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.week-sessions {
  font-size: 9px;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 8px;
}

.week-time {
  font-size: 11px;
  color: white;
  font-weight: 600;
  font-family: 'Inter', monospace;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 60px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  color: white;
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  opacity: 0.7;
}

.empty-state h3 {
  margin: 0;
  font-size: 24px;
}

.empty-state p {
  margin: 0;
  font-size: 16px;
  opacity: 0.8;
}

/* Responsive Design */
@media (max-width: 768px) {
  .monthly-report-view {
    padding: 16px;
  }

  .header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
    text-align: center;
  }

  .report-controls {
    flex-direction: column;
    gap: 20px;
    align-items: stretch;
  }

  .month-selector {
    justify-content: center;
  }

  .report-summary {
    grid-template-columns: 1fr;
  }

  .summary-card {
    justify-content: center;
    text-align: center;
  }

  .breakdown-header,
  .breakdown-row {
    grid-template-columns: 1fr;
    gap: 8px;
    text-align: center;
  }

  .breakdown-header {
    display: none;
  }

  .breakdown-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    margin-bottom: 8px;
  }

  .breakdown-row span::before {
    content: attr(data-label) ': ';
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);
  }

  .date-cell::before { content: 'Date: '; }
  .sessions-cell::before { content: 'Sessions: '; }
  .time-cell::before { content: 'Total Time: '; }
  .avg-cell::before { content: 'Average: '; }

  /* Mobile styles for person reports */
  .person-cards {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .person-card {
    padding: 16px;
  }

  .person-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
    text-align: center;
  }

  .person-info {
    justify-content: center;
    text-align: center;
  }

  .person-details h3 {
    max-width: none;
    font-size: 15px;
  }

  .person-stats {
    justify-content: center;
    gap: 20px;
  }

  .daily-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 6px;
    max-height: 150px;
  }

  .daily-item {
    padding: 6px 4px;
  }

  .daily-time {
    font-size: 10px;
  }

  .weekly-grid {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .weekly-item {
    padding: 8px;
  }

  .week-stats {
    flex-direction: column;
    gap: 4px;
    align-items: center;
  }

  .week-sessions {
    font-size: 8px;
  }

  .week-time {
    font-size: 10px;
  }

  .section-header {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
    gap: 8px;
  }

  .access-indicator {
    justify-content: center;
  }

  .admin-badge, .user-badge {
    padding: 6px 10px;
    font-size: 10px;
  }

  .badge-text {
    font-size: 9px;
  }
}
</style>

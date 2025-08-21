<template>
  <div class="dashboard">
    <!-- Header with user info and logout -->
    <header class="dashboard-header">
      <!-- Walking Dog Pet -->
      <div class="walking-dog">
        <div class="dog-container">
          <div class="dog-body">
            <div class="dog-head">
              <div class="dog-ear left-ear"></div>
              <div class="dog-ear right-ear"></div>
              <div class="dog-face">
                <div class="dog-eye left-eye"></div>
                <div class="dog-eye right-eye"></div>
                <div class="dog-nose"></div>
                <div class="dog-mouth"></div>
              </div>
            </div>
            <div class="dog-legs">
              <div class="dog-leg front-left"></div>
              <div class="dog-leg front-right"></div>
              <div class="dog-leg back-left"></div>
              <div class="dog-leg back-right"></div>
            </div>
            <div class="dog-tail"></div>
          </div>
        </div>
      </div>

      <div class="user-info">
        <div class="avatar">{{ username.charAt(0).toUpperCase() }}</div>
        <div class="user-details">
          <h3 style="color: #fcfcfc; font-size: 20px; font-weight: 600;">{{ username }}</h3>
          <p style="color: #fcfcfc; font-size: 16px;">{{ userEmail }}</p>
        </div>
      </div>
      <div class="header-actions">
        <button @click="viewCalendar" class="icon-btn" title="View Calendar Data">
          📅
        </button>
        <button @click="viewSpreadsheet" class="icon-btn" title="View Data Spreadsheet">
          📊
        </button>
        <button @click="testGoogleSheets" class="icon-btn" title="Test Google Sheets">
          🔗
        </button>
        <button @click="logout" class="icon-btn" title="Logout">
          🚪
        </button>
        <button @click="viewMonthlyReport" class="monthly-report-btn" title="View Monthly Report">
          <span class="btn-icon">📊</span>
          <span class="btn-text">Monthly Report</span>
          <div class="btn-shine"></div>
        </button>
      </div>
    </header>

    <!-- Main timer section -->
    <div class="timer-container">
      <!-- Notification area -->
      <div v-if="lastActionMessage" class="notification-area">
        <div class="notification success">
          <span class="notification-icon">✅</span>
          <span class="notification-text">{{ lastActionMessage }}</span>
        </div>
      </div>
      
      <div class="timer-card">
        <!-- Status indicators -->
        <div class="status-indicators">
          <div v-if="currentSessionDate" class="status-badge session-date">
            <div class="status-icon">📅</div>
            <div class="status-text">
              <span class="status-title">Session Date</span>
              <span class="status-subtitle">{{ formatSessionDate(currentSessionDate) }}</span>
            </div>
          </div>
          
          <div v-if="dataLoaded && time > 0 && !running" class="status-badge resumed">
            <div class="status-icon">✅</div>
            <div class="status-text">
              <span class="status-title">Session Resumed</span>
              <span class="status-subtitle">Previous: {{ previousTime }}</span>
            </div>
          </div>
          
          <div v-if="running" class="status-badge running">
            <div class="status-icon">🔄</div>
            <div class="status-text">
              <span class="status-title">Timer Running</span>
              <span class="status-subtitle">Continues in background</span>
            </div>
          </div>
          
          <div v-if="!dataLoaded || (time === 0 && !running)" class="status-badge fresh">
            <div class="status-icon">🆕</div>
            <div class="status-text">
              <span class="status-title">Fresh Start</span>
              <span class="status-subtitle">New timer session</span>
            </div>
          </div>
        </div>

        <!-- Main timer display -->
        <div class="timer-display">
          <div class="time-main">{{ formattedTime }}</div>
          <div class="time-secondary">
            <div class="time-stat">
              <span class="label">Total Seconds</span>
              <span class="value">{{ time.toLocaleString() }}</span>
            </div>
            <div class="time-stat">
              <span class="label">Remaining</span>
              <span class="value">{{ timeIHave }}</span>
            </div>
          </div>
        </div>

        <!-- Control buttons -->
        <div class="controls">
          <div class="primary-controls">
            <button @click="start" :disabled="running" class="control-btn start-btn">
              <span class="btn-icon">▶️</span>
              <span class="btn-text">{{ running ? 'Running' : 'Start' }}</span>
            </button>
            <button @click="stop" :disabled="!running" class="control-btn stop-btn">
              <span class="btn-icon">⏸️</span>
              <span class="btn-text">Pause</span>
            </button>
            <button @click="reset" class="control-btn reset-btn">
              <span class="btn-icon">🔄</span>
              <span class="btn-text">Reset</span>
            </button>
          </div>
        </div>

        <!-- Last saved info -->
        <div v-if="lastSaved" class="last-saved">
          <div class="saved-icon">💾</div>
          <div class="saved-text">
            <span class="saved-label">Last saved</span>
            <span class="saved-time">{{ lastSaved }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import sheetsService from '../services/sheetsService.js'

export default {
  name: 'Dashboard',
  components: {},
  data() {
    return {
      time: 0,
      running: false,
      interval: null,
      dataLoaded: false,
      lastSaved: null,
      previousTime: null,
      startTime: null,
      autoSaveInterval: null,
      lastActionMessage: '',
      currentSessionDate: null
    }
  },
  computed: {
    userEmail() {
      // Get user email from localStorage instead of route query
      return localStorage.getItem('currentUser') || 'User'
    },
    username() {
      const userEmail = this.userEmail
      return userEmail.split('@')[0]
    },
    formattedTime() {
      const hours = Math.floor(this.time / 3600)
      const minutes = Math.floor((this.time % 3600) / 60)
      const seconds = this.time % 60
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    },
    timeIHave() {
      const totalSeconds = 9 * 3600 // 8 hours in seconds
      const remainingSeconds = Math.max(totalSeconds - this.time, 0)
      const hours = Math.floor(remainingSeconds / 3600)
      const minutes = Math.floor((remainingSeconds % 3600) / 60)
      const seconds = remainingSeconds % 60
      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    },
    alertTime(){
      const alertTime = this.timeIHave;
      if(alertTime === "04:00:00"){
        alert("Half Time is up!");
      }else if(alertTime === "02:00:00"){
        alert("Quarter Time is up!");
      }else if(alertTime === "01:00:00"){
        alert("Final Hour is up!");
      }else{
        console.log("No alert needed at this time.");
      }
    }

  },
  methods: {
    start() {
      if (!this.running) {
        this.running = true
        this.startTime = Date.now() - (this.time * 1000)
        
        // Save start time to localStorage for session recovery
        this.saveStartTime()
        // Don't save to sheets when starting - only save when stopping
        this.updateTimeFromStartTime()
        // Update timer every second
        this.interval = setInterval(() => {
          this.updateTimeFromStartTime()
        }, 1000)
        
        // Auto-save every 10 seconds while running (to localStorage only)
        this.autoSaveInterval = setInterval(() => {
          // Save to localStorage for session recovery, not to sheets
          this.saveToLocalStorageOnly()
          this.saveToSheets()
        }, 10000)
      }
      this.saveToSheets()
    },
    stop() {
      this.running = false
      this.updateTimeFromStartTime()
      this.saveToSheets()
      this.clearStartTime()
      clearInterval(this.interval)
      clearInterval(this.autoSaveInterval)
    },
    reset() {
      this.stop()
      this.time = 0
      // Don't save to sheets when resetting - the stop() already saved the final time
      this.saveToLocalStorageOnly()
      this.dataLoaded = false
    },
    
    updateTimeFromStartTime() {
      if (this.startTime) {
        this.time = Math.floor((Date.now() - this.startTime) / 1000)
      }
    },
    
    saveStartTime() {
      // Save to localStorage to handle page refreshes
      const userEmail = this.userEmail
      const currentDate = new Date().toDateString()
      
      localStorage.setItem(`timer_start_${userEmail}`, this.startTime.toString())
      localStorage.setItem(`timer_session_date_${userEmail}`, currentDate)
      this.currentSessionDate = currentDate
      
      console.log('Start time and session date saved to localStorage for session persistence')
    },
    
    clearStartTime() {
      // Clear the start time from localStorage
      const userEmail = this.userEmail
      localStorage.removeItem(`timer_start_${userEmail}`)
      localStorage.removeItem(`timer_session_date_${userEmail}`)
      this.startTime = null
      this.currentSessionDate = null
      console.log('Start time and session date cleared from localStorage')
    },
    
    clearSessionData() {
      // Clear all session-related data when date changes
      const userEmail = this.userEmail
      
      // Clear timer state
      this.stop()
      this.time = 0
      this.dataLoaded = false
      this.previousTime = null
      this.lastSaved = null
      this.lastActionMessage = ''
      
      // Clear localStorage session data
      localStorage.removeItem(`timer_start_${userEmail}`)
      localStorage.removeItem(`timer_session_date_${userEmail}`)
      localStorage.removeItem(`timer_${userEmail}`)
      
      this.startTime = null
      this.currentSessionDate = null
      
      console.log('All session data cleared due to date change - starting fresh session')
      
      // Show notification to user
      this.showNotification('New day detected! Starting fresh timer session.', 'info')
    },
    
    checkForActiveTimer() {
      // Check localStorage for active timer to handle page refreshes
      const userEmail = this.userEmail
      const savedStartTime = localStorage.getItem(`timer_start_${userEmail}`)
      const sessionDate = localStorage.getItem(`timer_session_date_${userEmail}`)
      const currentDate = new Date().toDateString()
      
      // Check if the session date is different from today
      if (sessionDate && sessionDate !== currentDate) {
        console.log('Session date changed. Clearing old session data...')
        this.clearSessionData()
        return false
      }
      
      if (savedStartTime) {
        this.startTime = parseInt(savedStartTime)
        this.running = true
        this.currentSessionDate = sessionDate || currentDate
        this.updateTimeFromStartTime()
        
        // Resume intervals
        this.interval = setInterval(() => {
          this.updateTimeFromStartTime()
        }, 1000)
        
        this.autoSaveInterval = setInterval(() => {
          this.saveToSheets()
        }, 10000)
        
        console.log('Active timer restored from localStorage')
        return true
      }
      return false
    },
    
    async saveToSheets() {
      const userEmail = this.userEmail
      const DateTime = new Date().toLocaleString()
      const timeData = {
        user: userEmail,
        totalSeconds: this.time,
        formattedTime: this.formattedTime,
        lastUpdated: DateTime
      }
      
      // Save only to Google Sheets (this should only be called for completed sessions)
      const result = await sheetsService.saveTimerData(timeData)
      this.lastSaved = DateTime
      
      if (result.success) {
        if (result.action === 'updated') {
          console.log('✅ Updated daily total in Google Sheets:', result.message)
        } else {
          console.log('✅ Created new daily record in Google Sheets:', result.message)
        }
        
        // Show user-friendly notification
        // this.showNotification(result.message, 'success')
      } else {
        console.error('Failed to save to Google Sheets:', result.error)
        this.showNotification('Failed to save to Google Sheets: ' + result.error, 'error')
      }
      
      return result
    },
    
    showNotification(message, type = 'info') {
      // Simple notification - you can enhance this with a proper notification component
      console.log(`${type.toUpperCase()}: ${message}`)
      
      // For now, just update the last saved message to include the action
      if (type === 'success') {
        // You could show this in the UI somewhere
        this.lastActionMessage = message
        
        // Clear the message after 5 seconds
        setTimeout(() => {
          this.lastActionMessage = ''
        }, 5000)
      }
    },
    
    saveToLocalStorageOnly() {
      // Save only to localStorage for session recovery (not to Google Sheets)
      const userEmail = this.userEmail
      const currentDate = new Date().toDateString()
      const DateTime = new Date().toLocaleString()
      const timeData = {
        user: userEmail,
        totalSeconds: this.time,
        formattedTime: this.formattedTime,
        lastUpdated: DateTime
      }
      
      try {
        localStorage.setItem(`timer_${userEmail}`, JSON.stringify(timeData))
        localStorage.setItem(`timer_session_date_${userEmail}`, currentDate)
        this.lastSaved = DateTime
        this.currentSessionDate = currentDate
        console.log('Timer state saved to localStorage for session recovery')
      } catch (error) {
        console.error('Failed to save to localStorage:', error)
      }
    },
    
    async loadPreviousData() {
      const userEmail = this.userEmail
      const currentDate = new Date().toDateString()
      const sessionDate = localStorage.getItem(`timer_session_date_${userEmail}`)
      
      // Check if the session date is different from today
      if (sessionDate && sessionDate !== currentDate) {
        console.log('Date changed detected in loadPreviousData. Clearing old session data...')
        this.clearSessionData()
        return
      }
      
      try {
        // First try to load from Google Sheets
        const userData = await sheetsService.getUserTimerData(userEmail)
        
        if (userData && userData.length > 0) {
          // Get the most recent entry
          const latestData = userData[0]
          
          // Check if the latest data is from today
          const dataDate = new Date(latestData.timestamp || latestData.lastUpdated).toDateString()
          
          if (dataDate !== currentDate) {
            console.log('Latest data is from a different day. Starting fresh session.')
            this.time = 0
            this.dataLoaded = false
            this.currentSessionDate = currentDate
            return
          }
          
          // Store the previous time for display
          this.previousTime = latestData.formattedTime || '00:00:00'
          
          // Load the previous time
          this.time = latestData.totalSeconds || 0
          this.lastSaved = latestData.lastUpdated
          this.dataLoaded = true
          this.currentSessionDate = currentDate
          
          console.log('Data loaded from Google Sheets')
        } else {
          // Fallback to localStorage if no Google Sheets data
          await this.loadFromLocalStorage(userEmail, currentDate)
        }
      } catch (error) {
        console.error('Error loading data from Google Sheets:', error)
        // Fallback to localStorage
        await this.loadFromLocalStorage(userEmail, currentDate)
      }
    },
    
    async loadFromLocalStorage(userEmail, currentDate = null) {
      if (!currentDate) {
        currentDate = new Date().toDateString()
      }
      
      const sessionDate = localStorage.getItem(`timer_session_date_${userEmail}`)
      
      // Check if the session date is different from today
      if (sessionDate && sessionDate !== currentDate) {
        console.log('Date changed detected in loadFromLocalStorage. Starting fresh session.')
        this.time = 0
        this.dataLoaded = false
        this.currentSessionDate = currentDate
        return
      }
      
      try {
        const savedData = localStorage.getItem(`timer_${userEmail}`)
        
        if (savedData) {
          const data = JSON.parse(savedData)
          
          // Store the previous time for display
          this.previousTime = data.formattedTime || '00:00:00'
          
          // Load the previous time
          this.time = data.totalSeconds || 0
          this.lastSaved = data.lastUpdated
          this.dataLoaded = true
          this.currentSessionDate = sessionDate || currentDate
          
          console.log('Data loaded from localStorage fallback')
        } else {
          this.time = 0
          this.dataLoaded = false
          this.currentSessionDate = currentDate
          console.log('No previous data found')
        }
      } catch (error) {
        console.error('Error loading from localStorage:', error)
        this.time = 0
        this.dataLoaded = false
        this.currentSessionDate = currentDate
      }
    },
    
    handleVisibilityChange() {
      if (document.hidden) {
        // Tab became hidden - save current state to localStorage only (not sheets)
        if (this.running) {
          this.saveToLocalStorageOnly()
        }
      } else {
        // Tab became visible - check for date changes first
        const currentDate = new Date().toDateString()
        const sessionDate = localStorage.getItem(`timer_session_date_${this.userEmail}`)
        
        if (sessionDate && sessionDate !== currentDate) {
          console.log('Date changed while app was in background. Clearing session data...')
          this.clearSessionData()
          return
        }
        
        // Update time if timer was running
        if (this.running && this.startTime) {
          this.updateTimeFromStartTime()
        }
      }
    },
    
    handleBeforeUnload() {
      if (this.running) {
        this.updateTimeFromStartTime()
        // Save to localStorage for recovery, not to sheets (to avoid incomplete sessions)
        this.saveToLocalStorageOnly()
      }
    },
    
    viewSpreadsheet() {
      this.$router.push({ name: 'Spreadsheet' })
    },
    
    viewCalendar() {
      this.$router.push({ name: 'Calendar' })
    },
    
    logout() {
      // Clear all user data from localStorage
      localStorage.removeItem('currentUser')
      localStorage.removeItem('userSession')
      
      // Clear any timer-specific data
      const userEmail = this.userEmail
      localStorage.removeItem(`timer_${userEmail}`)
      localStorage.removeItem(`timer_start_${userEmail}`)
      localStorage.removeItem(`timer_session_date_${userEmail}`)
      
      // Stop any running timers
      if (this.running) {
        this.stop()
      }
      
      // Redirect to login
      this.$router.push({ name: 'Login' })
    },

    async viewMonthlyReport() {
      this.$router.push({ name: 'MonthlyReport' })
    },

    async testGoogleSheets() {
      console.log('Testing Google Sheets connection...')
      const result = await sheetsService.testConnection()
      
      if (result.success) {
        alert('✅ Google Sheets connection successful!\nCheck console for details.')
      } else {
        alert(`❌ Google Sheets connection failed:\n${result.error}\n\nCheck console for details.`)
      }
    },
    
    formatSessionDate(dateString) {
      if (!dateString) return ''
      
      const today = new Date().toDateString()
      const yesterday = new Date(Date.now() - 86400000).toDateString() // 24 hours ago
      
      if (dateString === today) {
        return 'Today'
      } else if (dateString === yesterday) {
        return 'Yesterday'
      } else {
        return new Date(dateString).toLocaleDateString()
      }
    }
  },
  
  mounted() {
    // Check for active timer first (to handle page refreshes)
    const hasActiveTimer = this.checkForActiveTimer()
    
    // Load previous data when component mounts (if no active timer)
    if (!hasActiveTimer) {
      this.loadPreviousData()
    } else {
      this.dataLoaded = true
    }
    
    // Listen for visibility changes to handle background/foreground transitions
    document.addEventListener('visibilitychange', this.handleVisibilityChange)
    
    // Listen for beforeunload to save state when user closes tab/browser
    window.addEventListener('beforeunload', this.handleBeforeUnload)
  },
  
  beforeUnmount() {
    clearInterval(this.interval)
    clearInterval(this.autoSaveInterval)
    
    // Save current state before unmounting to localStorage only
    if (this.running) {
      this.updateTimeFromStartTime()
      this.saveToLocalStorageOnly()
    }
    
    // Remove event listeners
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
    window.removeEventListener('beforeunload', this.handleBeforeUnload)
  },
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

.dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #575a85bb, #12255a);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Header Section */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #af7532bb, #8c10ca);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 20px 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
}

/* Walking Dog Pet */
.walking-dog {
  position: absolute;
  top: 66px; /* Adjusted for header height */
  left: 0;
  width: 100%;
  height: 30px;
  z-index: 1;
}

.dog-container:hover {
  animation: walkBackwards 3s linear infinite; /* Dog goes backwards when hovered */
}

.dog-container {
  position: absolute;
  width: 40px;
  height: 30px;
  animation: walkAcross 15s linear infinite;
}

.dog-body {
  position: relative;
  width: 100%;
  height: 100%;
}

.dog-head {
  position: absolute;
  top: 2px;
  left: 20px;
  width: 18px;
  height: 14px;
  background: linear-gradient(135deg, #323233bb, #b2b2b3);
  border-radius: 8px 8px 6px 6px;
  z-index: 3;
}

.dog-ear {
  position: absolute;
  width: 6px;
  height: 8px;
  background: #654321;
  border-radius: 50% 50% 0 50%;
}

.left-ear {
  top: -3px;
  left: 2px;
  transform: rotate(-20deg);
}

.right-ear {
  top: -3px;
  right: 2px;
  transform: rotate(20deg);
}

.dog-face {
  position: relative;
  width: 100%;
  height: 100%;
}

.dog-eye {
  position: absolute;
  width: 2px;
  height: 2px;
  background: #000;
  border-radius: 50%;
  top: 4px;
}

.left-eye {
  left: 4px;
}

.right-eye {
  right: 4px;
}

.dog-nose {
  position: absolute;
  width: 2px;
  height: 2px;
  background: #000;
  border-radius: 50%;
  top: 7px;
  left: 50%;
  transform: translateX(-50%);
}

.dog-mouth {
  position: absolute;
  width: 4px;
  height: 2px;
  border: 1px solid #000;
  border-top: none;
  border-radius: 0 0 4px 4px;
  top: 9px;
  left: 50%;
  transform: translateX(-50%);
}

.dog-body::before {
  content: '';
  position: absolute;
  top: 8px;
  left: 5px;
  width: 25px;
  height: 15px;
  background: linear-gradient(135deg, #323233bb, #b2b2b3);
  border-radius: 12px;
  z-index: 2;
}

.dog-legs {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 8px;
}

.dog-leg {
  position: absolute;
  width: 3px;
  height: 8px;
  background: #654321;
  border-radius: 2px;
  transform-origin: top center;
}

.front-left {
  left: 8px;
  animation: walkLegs 0.6s ease-in-out infinite;
}

.front-right {
  left: 14px;
  animation: walkLegs 0.6s ease-in-out infinite 0.3s;
}

.back-left {
  left: 20px;
  animation: walkLegs 0.6s ease-in-out infinite 0.15s;
}

.back-right {
  left: 26px;
  animation: walkLegs 0.6s ease-in-out infinite 0.45s;
}

.dog-tail {
  position: absolute;
  top: 10px;
  left: 2px;
  width: 8px;
  height: 3px;
  background: #654321;
  border-radius: 50%;
  transform-origin: right center;
  animation: wagTail 0.8s ease-in-out infinite;
  z-index: 1;
}

@keyframes walkAcross {
  0% {
    left: -60px;
  }
  100% {
    left: calc(100% + 20px);
  }
}

@keyframes walkBackwards {
  0% {
    left: calc(100% + 20px);
    transform: scaleX(-1); /* Flip the dog to face left */
  }
  100% {
    left: -60px;
    transform: scaleX(-1); /* Keep flipped while going backwards */
  }
}

@keyframes walkLegs {
  0%, 100% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(25deg);
  }
}

@keyframes wagTail {
  0%, 100% {
    transform: rotate(-10deg);
  }
  50% {
    transform: rotate(15deg);
  }
}

/* Notification Area */
.notification-area {
  margin-bottom: 20px;
}

.notification {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.3s ease-out;
}

.notification.success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.notification-icon {
  font-size: 20px;
}

.notification-text {
  font-weight: 500;
  font-size: 14px;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2929bbbb, #242225);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 18px;
}

.user-details h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.user-details p {
  margin: 4px 0 0 0;
  font-size: 14px;
  color: #666;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.icon-btn {
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 12px;
  background: rgba(102, 126, 234, 0.1);
  color: #121314;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  background: rgba(102, 126, 234, 0.2);
  transform: translateY(-2px);
}

/* Monthly Report Button - Cool Design */
.monthly-report-btn {
  position: relative;
  padding: 12px 20px;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
  overflow: hidden;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.monthly-report-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  transition: left 0.6s ease;
}

.monthly-report-btn:hover::before {
  left: 100%;
}

.monthly-report-btn:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 12px 35px rgba(102, 126, 234, 0.6);
  background: linear-gradient(135deg, #764ba2 0%, #667eea 50%, #f093fb 100%);
}

.monthly-report-btn:active {
  transform: translateY(-1px) scale(1.01);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.monthly-report-btn .btn-icon {
  font-size: 16px;
  animation: pulse-icon 2s infinite;
}

.monthly-report-btn .btn-text {
  font-size: 12px;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.btn-shine {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    45deg,
    transparent 30%,
    rgba(255, 255, 255, 0.1) 50%,
    transparent 70%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}

.monthly-report-btn:hover .btn-shine {
  opacity: 1;
}

@keyframes pulse-icon {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

/* Timer Container */
.timer-container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
}

.timer-card {
  background: linear-gradient(135deg, #3434e4bb, #242225);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  text-align: center;
  max-width: 500px;
  width: 100%;
}

/* Status Indicators */
.status-indicators {
  margin-bottom: 32px;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-radius: 12px;
  margin-bottom: 16px;
  border: 1px solid;
  background: rgba(255, 255, 255, 0.8);
}

.status-badge.resumed {
  background: rgba(212, 237, 218, 0.8);
  border-color: #c3e6cb;
  color: #155724;
}

.status-badge.running {
  background: rgba(255, 243, 205, 0.8);
  border-color: #ffeaa7;
  color: #856404;
  animation: pulse 2s infinite;
}

.status-badge.fresh {
  background: rgba(209, 236, 241, 0.8);
  border-color: #bee5eb;
  color: #0c5460;
}

.status-badge.session-date {
  background: rgba(240, 240, 240, 0.9);
  border-color: #d0d0d0;
  color: #333;
}

.status-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.status-text {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.status-title {
  font-weight: 600;
  font-size: 14px;
}

.status-subtitle {
  font-size: 12px;
  opacity: 0.8;
  margin-top: 2px;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* Timer Display */
.timer-display {
  margin-bottom: 40px;
}

.time-main {
  font-size: 4rem;
  font-weight: 700;
  color: #dbd1d1;
  margin-bottom: 20px;
  font-family: 'Inter', monospace;
  letter-spacing: -2px;
}

.time-secondary {
  display: flex;
  justify-content: center;
  gap: 32px;
}

.time-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.time-stat .label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #666;
  font-weight: 500;
}

.time-stat .value {
  font-size: 16px;
  font-weight: 600;
  color: #b4acac;
  font-family: 'Inter', monospace;
}

/* Controls */
.controls {
  margin-bottom: 32px;
}

.primary-controls {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  border: none;
  border-radius: 12px;
  font-family: inherit;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;
  justify-content: center;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.start-btn {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  box-shadow: 0 4px 16px rgba(76, 175, 80, 0.3);
}

.start-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
}

.stop-btn {
  background: linear-gradient(135deg, #f44336, #da190b);
  color: white;
  box-shadow: 0 4px 16px rgba(244, 67, 54, 0.3);
}

.stop-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(244, 67, 54, 0.4);
}

.reset-btn {
  background: linear-gradient(135deg, #008CBA, #007B9A);
  color: white;
  box-shadow: 0 4px 16px rgba(0, 140, 186, 0.3);
}

.reset-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 140, 186, 0.4);
}

.btn-icon {
  font-size: 16px;
}

.btn-text {
  font-size: 14px;
}

/* Last Saved */
.last-saved {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  background: rgba(248, 249, 250, 0.8);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.saved-icon {
  font-size: 18px;
  opacity: 0.7;
}

.saved-text {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.saved-label {
  font-size: 12px;
  color: #b6b6b6;
  font-weight: 500;
}

.saved-time {
  font-size: 13px;
  color: #333;
  font-weight: 600;
}

/* Stats Section */
.stats-section {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

/* Responsive Design */
@media (max-width: 768px) {
  .dashboard {
    padding: 16px;
    gap: 20px;
  }

  .dashboard-header {
    flex-direction: column;
    gap: 16px;
    padding: 20px;
    min-height: 120px; /* Extra space for the dog */
  }

  .walking-dog {
    top: 15px; /* Adjust position for mobile */
  }

  .dog-container {
    animation: walkAcross 12s linear infinite; /* Slightly faster on mobile */
  }

  .header-actions {
    order: -1;
    align-self: flex-end;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
  }

  .monthly-report-btn {
    padding: 10px 16px;
    font-size: 12px;
    border-radius: 12px;
  }

  .monthly-report-btn .btn-text {
    font-size: 11px;
  }

  .monthly-report-btn .btn-icon {
    font-size: 14px;
  }

  .timer-card {
    padding: 32px 24px;
  }

  .time-main {
    font-size: 3rem;
  }

  .time-secondary {
    flex-direction: column;
    gap: 16px;
  }

  .primary-controls {
    flex-direction: column;
    gap: 12px;
  }

  .control-btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .time-main {
    font-size: 2.5rem;
  }

  .user-details h3 {
    font-size: 16px;
  }

  .user-details p {
    font-size: 13px;
  }
}
</style>
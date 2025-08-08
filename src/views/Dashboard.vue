<template>
  <div class="dashboard">
    <div class="card">
      <h2>Welcome, {{ username }}!</h2>
      
      <!-- Show if data was loaded from storage -->
      <div v-if="dataLoaded && time > 0 && !running" class="storage-status">
        ✅ Resumed from previous session: {{ previousTime }}
      </div>
      
      <!-- Show if timer is currently running -->
      <div v-if="running" class="running-status">
        🔄 Timer is running (continues in background)
      </div>
      
      <!-- Show if starting fresh -->
      <div v-if="!dataLoaded || (time === 0 && !running)" class="fresh-start">
        🆕 Starting fresh timer
      </div>
      
      <div class="time">{{ formattedTime }}</div>
      
      <!-- Show total time in seconds for reference -->
      <div class="time-info">
        Total seconds: {{ time }}
      </div>
      <div class="time-info">
        Time I have: {{ timeIHave }}
      </div>
      
      <div class="buttons">
        <button @click="start" :disabled="running" class="start-btn">Start</button>
        <button @click="stop" :disabled="!running" class="stop-btn">Pause</button>
      </div>
       <button @click="reset" class="reset-btn">Reset</button> 
      <!-- Show last saved info -->
      <div v-if="lastSaved" class="last-saved">
        Last saved: {{ lastSaved }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      time: 0,
      running: false,
      interval: null,
      dataLoaded: false,
      lastSaved: null,
      previousTime: null,
      startTime: null,
      autoSaveInterval: null
    }
  },
  computed: {
    userEmail() {
      console.log(this.$route.query.email);
      return this.$route.query.email || 'User'
    },
    username() {
      const userEmail = this.$route.query.email || 'User'
      return userEmail.split('@')[0]
    },
    formattedTime() {
      const hours = Math.floor(this.time / 3600)
      const minutes = Math.floor((this.time % 3600) / 60)
      const seconds = this.time % 60
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    },
    timeIHave() {
      const totalSeconds = 8 * 3600 // 8 hours in seconds
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
        
        // Save start time to localStorage
        this.saveStartTime()
        this.updateTimeFromStartTime()
        // Update timer every second
        this.interval = setInterval(() => {
          this.updateTimeFromStartTime()
        }, 1000)
        
        // Auto-save every 10 seconds while running
        this.autoSaveInterval = setInterval(() => {
          this.timesavetolocalStorage()
        }, 10000)
      }
    },
    stop() {
      this.running = false
      this.updateTimeFromStartTime()
      this.timesavetolocalStorage()
      this.clearStartTime()
      clearInterval(this.interval)
      clearInterval(this.autoSaveInterval)
    },
    reset() {
      this.stop()
      this.time = 0
      this.timesavetolocalStorage()
      this.dataLoaded = false
    },
    
    updateTimeFromStartTime() {
      if (this.startTime) {
        this.time = Math.floor((Date.now() - this.startTime) / 1000)
      }
    },
    
    saveStartTime() {
      const userEmail = this.$route.query.email || 'User'
      localStorage.setItem(`timer_start_${userEmail}`, this.startTime.toString())
    },
    
    clearStartTime() {
      const userEmail = this.$route.query.email || 'User'
      localStorage.removeItem(`timer_start_${userEmail}`)
      this.startTime = null
    },
    
    checkForActiveTimer() {
      const userEmail = this.$route.query.email || 'User'
      const savedStartTime = localStorage.getItem(`timer_start_${userEmail}`)
      
      if (savedStartTime) {
        this.startTime = parseInt(savedStartTime)
        this.running = true
        this.updateTimeFromStartTime()
        
        // Resume intervals
        this.interval = setInterval(() => {
          this.updateTimeFromStartTime()
        }, 1000)
        
        this.autoSaveInterval = setInterval(() => {
          this.timesavetolocalStorage()
        }, 10000)
        
        return true
      }
      return false
    },
    timesavetolocalStorage() {
      const userEmail = this.$route.query.email || 'User'
      const DateTime = new Date().toLocaleString()
      const timeData = {
        user: userEmail,
        totalSeconds: this.time,
        formattedTime: this.formattedTime,
        lastUpdated: DateTime
      }
      
      localStorage.setItem(`timer_${userEmail}`, JSON.stringify(timeData))
      this.lastSaved = DateTime
    },
    
    loadPreviousData() {
      const userEmail = this.$route.query.email || 'User'
      
      // First check if there's an active timer running
      const hasActiveTimer = this.checkForActiveTimer()
      
      if (!hasActiveTimer) {
        // If no active timer, load saved data
        const savedData = localStorage.getItem(`timer_${userEmail}`)
        
        if (savedData) {
          try {
            const data = JSON.parse(savedData)
            
            // Store the previous time for display
            this.previousTime = data.formattedTime || '00:00:00'
            
            // Load the previous time
            this.time = data.totalSeconds || 0
            this.lastSaved = data.lastUpdated
            this.dataLoaded = true
            
          } catch (error) {
            this.time = 0
            this.dataLoaded = false
          }
        } else {
          this.time = 0
          this.dataLoaded = false
        }
      } else {
        this.dataLoaded = true
      }
    },
    
    handleVisibilityChange() {
      if (document.hidden) {
        // Tab became hidden - save current state
        if (this.running) {
          this.timesavetolocalStorage()
        }
      } else {
        // Tab became visible - update time if timer was running
        if (this.running && this.startTime) {
          this.updateTimeFromStartTime()
        }
      }
    },
    
    handleBeforeUnload() {
      if (this.running) {
        this.updateTimeFromStartTime()
        this.timesavetolocalStorage()
      }
    }
  },
  
  mounted() {
    // Load previous data when component mounts
    this.loadPreviousData()
    
    // Listen for visibility changes to handle background/foreground transitions
    document.addEventListener('visibilitychange', this.handleVisibilityChange)
    
    // Listen for beforeunload to save state when user closes tab/browser
    window.addEventListener('beforeunload', this.handleBeforeUnload)
  },
  
  // Also watch for route changes
  watch: {
    userEmail: {
      handler(newEmail) {
        if (newEmail) {
          this.loadPreviousData()
        }
      },
      immediate: true
    }
  },
  beforeUnmount() {
    clearInterval(this.interval)
    clearInterval(this.autoSaveInterval)
    
    // Save current state before unmounting
    if (this.running) {
      this.updateTimeFromStartTime()
      this.timesavetolocalStorage()
    }
    
    // Remove event listeners
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
    window.removeEventListener('beforeunload', this.handleBeforeUnload)
  },
}
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: Arial, sans-serif;
}

.card {
  background: white;
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  text-align: center;
  min-width: 300px;
}

h2 {
  margin: 0 0 20px 0;
  color: #333;
}

.time {
  font-size: 3rem;
  font-weight: bold;
  margin: 30px 0;
  color: #444;
}

.time-info {
  font-size: 14px;
  color: #666;
  margin: -20px 0 20px 0;
}

.storage-status {
  background: #d4edda;
  color: #155724;
  padding: 8px 16px;
  border-radius: 5px;
  margin-bottom: 20px;
  font-size: 14px;
  border: 1px solid #c3e6cb;
}

.running-status {
  background: #fff3cd;
  color: #856404;
  padding: 8px 16px;
  border-radius: 5px;
  margin-bottom: 20px;
  font-size: 14px;
  border: 1px solid #ffeaa7;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.fresh-start {
  background: #d1ecf1;
  color: #0c5460;
  padding: 8px 16px;
  border-radius: 5px;
  margin-bottom: 20px;
  font-size: 14px;
  border: 1px solid #bee5eb;
}

.last-saved {
  margin-top: 20px;
  font-size: 12px;
  color: #666;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 5px;
}

.buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
}

button {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.start-btn {
  background: #4CAF50;
  color: white;
}

.start-btn:hover:not(:disabled) {
  background: #45a049;
}

.stop-btn {
  background: #f44336;
  color: white;
}

.stop-btn:hover:not(:disabled) {
  background: #da190b;
}

.reset-btn {
  background: #008CBA;
  color: white;
}

.reset-btn:hover {
  background: #007B9A;
}
</style>
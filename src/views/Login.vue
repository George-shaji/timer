<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: 'Inter', sans-serif;
}

.login-container {
  position: relative;
  width: 420px;
  margin: 100px auto;
  padding: 48px;
  background: #111111;
  border: 1px solid #333333;
  border-radius: 16px;
  text-align: center;
  font-family: 'Inter', sans-serif;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.4),
    0 4px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.login-container::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #000000;
  z-index: -1;
}

.login-container:hover {
  border-color: #444444;
  box-shadow: 
    0 24px 48px rgba(0, 0, 0, 0.5),
    0 8px 16px rgba(0, 0, 0, 0.3);
}

h2 {
  color: #ffffff;
  font-weight: 600;
  font-size: 28px;
  margin-bottom: 32px;
  letter-spacing: -0.5px;
  line-height: 1.2;
}

form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

input {
  background: #1a1a1a;
  border: 1px solid #333333;
  border-radius: 8px;
  padding: 16px 18px;
  font-size: 15px;
  color: #ffffff;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  transition: all 0.2s ease;
  outline: none;
}

input::placeholder {
  color: #666666;
  font-weight: 400;
}

input:focus {
  border-color: #555555;
  background: #222222;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.05);
}

input:hover {
  border-color: #444444;
}

button {
  background: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 16px 20px;
  font-size: 15px;
  font-weight: 500;
  color: #000000;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 8px;
}

button:hover {
  background: #f5f5f5;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);
}

button:active {
  transform: translateY(0);
  background: #e5e5e5;
}

button:focus {
  outline: none;
  box-shadow: 
    0 0 0 3px rgba(255, 255, 255, 0.1),
    0 4px 12px rgba(255, 255, 255, 0.1);
}

/* Alternative dark button style */
.dark-button {
  background: #333333;
  color: #ffffff;
  border: 1px solid #444444;
}

.dark-button:hover {
  background: #404040;
  border-color: #555555;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.dark-button:active {
  transform: translateY(0);
  background: #2a2a2a;
}

/* Responsive design */
@media (max-width: 480px) {
  .login-container {
    width: 90%;
    margin: 60px auto;
    padding: 32px 24px;
  }
  
  h2 {
    font-size: 24px;
    margin-bottom: 24px;
  }
  
  input, button {
    padding: 14px 16px;
    font-size: 14px;
  }
}


</style>

<template>
  <div class="login-container">
    <h2>Login</h2>
    <form @submit.prevent="handleLogin">
      <input type="text" v-model="email" placeholder="Email" required />
      <input type="password" v-model="password" placeholder="Password" required />
      <button type="submit">Login</button>
    </form>
  </div>
</template>

<script>
    export default {
      data() {
        return {
          email: '',
          password: ''
        };
      },
      methods: {
        handleLogin() {
          if (this.email === "george@gmail.com" && this.password === "password123") {
            // Store user info securely in localStorage
            localStorage.setItem('currentUser', this.email)
            localStorage.setItem('userSession', JSON.stringify({
              email: this.email,
              loginTime: new Date().toISOString()
            }))
            this.$router.push({ name: 'Dashboard' });
          }else if (this.email === "joy@gmail.com" && this.password === "password123") {
            localStorage.setItem('currentUser', this.email)
            localStorage.setItem('userSession', JSON.stringify({
              email: this.email,
              loginTime: new Date().toISOString()
            }))
            this.$router.push({ name: 'Dashboard' });
          }else if (this.email === "Ajesh@gmail.com" && this.password === "password123") {
            localStorage.setItem('currentUser', this.email)
            localStorage.setItem('userSession', JSON.stringify({
              email: this.email,
              loginTime: new Date().toISOString()
            }))
            this.$router.push({ name: 'Dashboard' });
          }else if (this.email === "Manoj@gmail.com" && this.password === "password123") {
            localStorage.setItem('currentUser', this.email)
            localStorage.setItem('userSession', JSON.stringify({
              email: this.email,
              loginTime: new Date().toISOString()
            }))
            this.$router.push({ name: 'Dashboard' });
          }else if (this.email === "Vysakh@gmail.com" && this.password === "password123") {
            localStorage.setItem('currentUser', this.email)
            localStorage.setItem('userSession', JSON.stringify({
              email: this.email,
              loginTime: new Date().toISOString()
            }))
            this.$router.push({ name: 'Dashboard' });
          }else {
            alert("login failed, please try again");
          }
        }
      }
    };
</script>

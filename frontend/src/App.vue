<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <div id="app">
    <RouterView />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #333;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* Prevent iOS zoom on input focus */
  -webkit-text-size-adjust: 100%;
  /* Prevent iOS bounce scrolling */
  overscroll-behavior: none;
}

#app {
  min-height: 100vh;
  /* Support for iPhone safe areas */
  min-height: calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom));
}

/* iPhone specific optimizations */
@media (max-width: 768px) {
  body {
    font-size: 14px;
  }
  
  /* Prevent iOS zoom on double tap */
  * {
    touch-action: manipulation;
  }
  
  /* Improve tap highlights */
  button, a, input, select, textarea {
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
  }
  
  /* Prevent iOS bounce scrolling */
  html, body {
    position: fixed;
    overflow: hidden;
    width: 100%;
    height: 100%;
  }
  
  #app {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    height: 100%;
  }
}

/* iPhone landscape optimizations */
@media (max-width: 768px) and (orientation: landscape) {
  body {
    font-size: 13px;
  }
}

/* iPhone X/11/12/13/14/15 series safe area support */
@supports (padding: max(0px)) {
  #app {
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
  }
}
</style>

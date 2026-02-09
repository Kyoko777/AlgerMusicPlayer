<template>
  <div 
    class="sync-room-control fixed left-4 bottom-24 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[9999] select-none transition-all duration-700 ease-in-out"
    :style="panelStyle"
    :class="{ 'border border-white/20': !isMinimized }"
  >
    <!-- 渐变定义 -->
    <svg width="0" height="0" class="absolute">
      <defs>
        <linearGradient id="note-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#c084fc;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#6366f1;stop-opacity:1" />
        </linearGradient>
      </defs>
    </svg>

    <!-- 面板背景层 -->
    <div v-if="!isMinimized" class="absolute inset-0 z-0">
      <img src="@/assets/sync/bg.jpg" class="w-full h-full object-cover grayscale-[0.2] opacity-50" />
      <div class="absolute inset-0 bg-gradient-to-br from-black/90 via-black/70 to-black/95 backdrop-blur-md"></div>
    </div>

    <!-- Siri 式悬浮球 (收起时) -->
    <div 
      v-if="isMinimized" 
      @click="toggleMinimize"
      class="relative z-20 w-14 h-14 flex items-center justify-center cursor-pointer group overflow-visible"
    >
      <!-- Siri 核心流体层 -->
      <div class="absolute inset-0 flex items-center justify-center overflow-visible">
        <!-- 多个弥散发光圆球模拟流体 -->
        <div :class="['absolute w-12 h-12 rounded-full blur-xl opacity-60 mix-blend-screen', isPlay ? 'bg-purple-500 animate-siri-1' : 'bg-blue-500 animate-siri-1']"></div>
        <div :class="['absolute w-10 h-10 rounded-full blur-lg opacity-70 mix-blend-screen', isPlay ? 'bg-blue-400 animate-siri-2' : 'bg-cyan-400 animate-siri-2']"></div>
        <div :class="['absolute w-8 h-8 rounded-full blur-md opacity-80 mix-blend-screen', isPlay ? 'bg-pink-500 animate-siri-3' : 'bg-indigo-500 animate-siri-3']"></div>
      </div>
      
      <!-- 中心图标 -->
      <div class="relative w-10 h-10 rounded-full flex items-center justify-center bg-white/5 backdrop-blur-md border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500">
        <svg viewBox="0 0 24 24" class="w-5 h-5 transition-transform duration-500" :class="{ 'animate-spin-slow': isPlay }">
          <path fill="url(#note-gradient)" d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
        </svg>
      </div>
    </div>

    <!-- 完整面板模式 -->
    <div v-else class="relative z-10 h-full flex flex-col justify-between p-4 text-white animate-fade-in">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <div :class="['w-2 h-2 rounded-full shadow-lg transition-all duration-500', isSyncing ? 'bg-green-400 shadow-[0_0_10px_#4ade80]' : 'bg-gray-500']"></div>
          <span class="text-[10px] font-black tracking-[0.2em] uppercase opacity-90">{{ isSyncing ? 'Linked' : 'Sync' }}</span>
        </div>
        <div class="flex items-center space-x-3">
          <button @click="toggleSettings" class="transition-all hover:scale-125 active:rotate-12 opacity-70 hover:opacity-100">
            <svg viewBox="0 0 24 24" class="w-4 h-4">
              <path fill="url(#note-gradient)" d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
          </button>
          <button @click="toggleMinimize" class="transition-all hover:scale-125 opacity-70 hover:opacity-100">
            <svg viewBox="0 0 24 24" class="w-4 h-4 fill-none stroke-current stroke-2">
              <path d="M18 15l-6-6-6 6"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 设置界面 -->
      <div v-if="isSetting" class="flex-1 flex flex-col justify-center space-y-3 py-2">
        <div class="text-[9px] text-purple-400 uppercase tracking-widest font-black">Node Endpoint</div>
        <input 
          v-model="serverUrlInput" 
          type="text" 
          placeholder="https://server.loca.lt"
          class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] focus:outline-none focus:border-purple-500/50 text-white placeholder:text-gray-600 transition-all"
        />
        <button @click="saveServerUrl" class="w-full py-2 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">
          Deploy Logic
        </button>
      </div>

      <!-- 主界面 -->
      <div v-else class="flex-1 flex flex-col justify-center space-y-3">
        <div v-if="!isSyncing" class="space-y-3">
          <input 
            v-model="roomInput" 
            type="text" 
            maxlength="8"
            placeholder="ACCESS CODE"
            class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-white/30 text-white placeholder:text-gray-600 text-center tracking-[0.3em] uppercase font-mono"
          />
          <div class="grid grid-cols-2 gap-2">
            <button @click="handleJoin('private')" class="py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[10px] font-black uppercase transition-all active:scale-95">2P</button>
            <button @click="handleJoin('public')" class="py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[10px] font-black uppercase transition-all active:scale-95">Multi</button>
          </div>
        </div>
        <div v-else class="flex flex-col items-center justify-center space-y-2 py-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-xl">
          <div class="text-[8px] text-purple-400 uppercase tracking-[0.5em] font-black">Quantum Room</div>
          <div class="text-lg font-mono font-black text-white tracking-[0.3em]">{{ roomId }}</div>
          <button @click="leaveRoom" class="text-[8px] text-red-500/80 font-black hover:text-red-400 uppercase tracking-widest mt-1">Disconnect</button>
        </div>
      </div>

      <!-- 底部拖动手柄 -->
      <div class="absolute bottom-1 right-1 w-3 h-3 cursor-nwse-resize opacity-20 hover:opacity-100 transition-opacity text-white">
        <svg viewBox="0 0 24 24" class="w-full h-full fill-current"><path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM18 18H16V16H18V18ZM14 22H12V20H14V22ZM22 14H20V12H22V14Z"/></svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useSyncStore } from '@/store/modules/sync';
import { usePlayerStore } from '@/store/modules/player';

const syncStore = useSyncStore();
const playerStore = usePlayerStore();
const { isSyncing, roomId } = storeToRefs(syncStore);
const { isPlay } = storeToRefs(playerStore);

const roomInput = ref('');
const isSetting = ref(false);
const isMinimized = ref(false);
const serverUrlInput = ref('');

onMounted(() => {
  serverUrlInput.value = window.localStorage.getItem('SYNC_SERVER_URL') || '';
});

const panelStyle = computed(() => {
  if (isMinimized.value) {
    return {
      width: '56px',
      height: '56px',
      borderRadius: '50%',
      padding: '0',
      background: 'transparent',
      border: 'none',
      boxShadow: 'none',
      overflow: 'visible'
    };
  }
  return {
    width: '180px',
    height: '180px',
    resize: 'both',
    minWidth: '160px',
    minHeight: '160px',
    background: '#000'
  };
});

const toggleMinimize = () => {
  isMinimized.value = !isMinimized.value;
  isSetting.value = false;
};

const toggleSettings = () => {
  isSetting.value = !isSetting.value;
};

const saveServerUrl = () => {
  window.localStorage.setItem('SYNC_SERVER_URL', serverUrlInput.value);
  isSetting.value = false;
  window.location.reload();
};

const handleJoin = (type: 'private' | 'public') => {
  if (!roomInput.value) {
    roomInput.value = Math.random().toString(36).substring(7).toUpperCase();
  }
  syncStore.initSync(roomInput.value, type);
};

const leaveRoom = () => {
  syncStore.leaveRoom();
  roomInput.value = '';
};
</script>

<style scoped>
/* Siri 式流体动画 */
@keyframes siri-1 {
  0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.6; }
  33% { transform: scale(1.2) translate(5px, -5px); opacity: 0.4; }
  66% { transform: scale(0.9) translate(-5px, 5px); opacity: 0.7; }
}

@keyframes siri-2 {
  0%, 100% { transform: scale(1.1) translate(0, 0); opacity: 0.5; }
  33% { transform: scale(0.8) translate(-8px, 8px); opacity: 0.8; }
  66% { transform: scale(1.3) translate(8px, -8px); opacity: 0.3; }
}

@keyframes siri-3 {
  0%, 100% { transform: scale(0.9) translate(0, 0); opacity: 0.7; }
  33% { transform: scale(1.4) translate(10px, 10px); opacity: 0.4; }
  66% { transform: scale(1.1) translate(-10px, -10px); opacity: 0.6; }
}

.animate-siri-1 { animation: siri-1 4s infinite ease-in-out; }
.animate-siri-2 { animation: siri-2 5s infinite ease-in-out; }
.animate-siri-3 { animation: siri-3 3s infinite ease-in-out; }

.animate-spin-slow {
  animation: spin 6s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.sync-room-control::-webkit-scrollbar {
  display: none;
}
</style>

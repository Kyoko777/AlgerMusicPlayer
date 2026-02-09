<template>
  <div 
    ref="panelRef"
    class="sync-room-control fixed z-[9999] select-none transition-all duration-700 ease-in-out"
    :style="panelStyle"
    :class="{ 
      'rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/20 overflow-hidden': !isMinimized, 
      'overflow-visible bg-transparent': isMinimized,
      'dragging-active': isDragging 
    }"
    @mousedown="handleMouseDown"
  >
    <!-- 渐变定义 -->
    <svg width="0" height="0" class="absolute">
      <defs>
        <linearGradient id="note-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#c084fc;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#6366f1;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="headphone-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#ff00ff;stop-opacity:1">
            <animate attributeName="stop-color" values="#ff00ff;#7000ff;#00ffff;#ff00ff" dur="4s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" style="stop-color:#00ffff;stop-opacity:1">
            <animate attributeName="stop-color" values="#00ffff;#ff00ff;#7000ff;#00ffff" dur="4s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
        <linearGradient id="ekg-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#e8d5ff;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#d8b4fe;stop-opacity:1" />
        </linearGradient>
      </defs>
    </svg>

    <!-- 面板背景层 (展开模式) -->
    <div v-if="!isMinimized" class="absolute inset-0 z-0">
      <img src="@/assets/sync/bg.jpg" class="w-full h-full object-cover grayscale-[0.2] opacity-60" draggable="false" />
      <div class="absolute inset-0 bg-gradient-to-br from-black/95 via-black/80 to-black/95 backdrop-blur-md"></div>
    </div>

    <!-- Pingu 听歌形态 (收起模式) -->
    <div 
      v-if="isMinimized" 
      @click="handleBallClick"
      class="relative z-20 w-24 h-24 flex items-center justify-center cursor-pointer group overflow-visible transition-transform duration-300 hover:scale-105"
    >
      <!-- Pingu 身体形态 - 仅向右微调位置 (translate-x 从 -2 变为 -1) -->
      <div class="relative w-16 h-16 flex items-center justify-center z-20 transition-transform duration-500 -translate-x-1" :class="{ 'animate-pingu-sway': isPlay }">
        <!-- Pingu 主体图片 -->
        <img src="@/assets/sync/pingu_head_v2.png" class="w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" draggable="false" />
        
        <!-- 耳机缩小 10% (从 130% 降至 120%，不影响企鹅大小) -->
        <svg viewBox="0 0 100 100" class="absolute inset-[-12px] w-[120%] h-[120%] pointer-events-none z-30 transition-all duration-500" :class="{ 'animate-headphone-vibrate': isPlay }">
          <path d="M25 45 A 25 25 0 0 1 75 45" fill="none" stroke="url(#headphone-gradient)" stroke-width="6" stroke-linecap="round" class="drop-shadow-[0_0_8px_rgba(192,132,252,0.6)]" />
          <rect x="18" y="40" width="12" height="24" rx="5" fill="url(#headphone-gradient)" class="drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]" />
          <rect x="70" y="40" width="12" height="24" rx="5" fill="url(#headphone-gradient)" class="drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]" />
        </svg>
      </div>

      <!-- 动态浮动音符粒子 - 调整起点至耳机两侧，避免挡脸 -->
      <div class="absolute inset-0 overflow-visible pointer-events-none z-40">
        <!-- 左耳出来的音符 -->
        <svg viewBox="0 0 24 24" :class="['absolute w-5 h-5 fill-current mix-blend-screen', isPlay ? 'animate-note-float-left' : 'opacity-0']" style="left: 15%; top: 40%; color: #c084fc;">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
        </svg>
        <!-- 右耳出来的音符 -->
        <svg viewBox="0 0 24 24" :class="['absolute w-5 h-5 fill-current mix-blend-screen', isPlay ? 'animate-note-float-right' : 'opacity-0']" style="right: 15%; top: 40%; color: #6366f1;">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
        </svg>
        <!-- 顶部中心稍微向上的音符 -->
        <svg viewBox="0 0 24 24" :class="['absolute w-4 h-4 fill-current mix-blend-screen', isPlay ? 'animate-note-float-top' : 'opacity-0']" style="left: 45%; top: 20%; color: #ec4899;">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
        </svg>
      </div>
    </div>

    <!-- 完整面板模式 (保持操作界面不丢失) -->
    <div v-else class="relative z-10 h-full flex flex-col justify-between p-4 text-white animate-fade-in">
      <div class="flex items-center justify-between cursor-move drag-handle">
        <div class="flex items-center space-x-2">
          <div :class="['w-2 h-2 rounded-full shadow-lg transition-all duration-500', isSyncing ? 'bg-green-400 shadow-[0_0_10px_#4ade80]' : 'bg-gray-500']"></div>
          <span class="text-[10px] font-black tracking-[0.2em] uppercase opacity-90">{{ isSyncing ? 'Linked' : 'Sync' }}</span>
        </div>
        <div class="flex items-center space-x-3">
          <button @click.stop="toggleSettings" class="transition-all hover:scale-125 active:rotate-12">
            <svg viewBox="0 0 24 24" class="w-6 h-6">
              <circle fill="url(#note-gradient)" cx="5" cy="18" r="4" />
              <path fill="url(#note-gradient)" d="M8 18V5h1.5v13H8z" />
              <circle fill="url(#note-gradient)" cx="19" cy="18" r="4" />
              <path fill="url(#note-gradient)" d="M22 18V7h1.5v11H22z" />
              <path fill="none" stroke="url(#ekg-gradient)" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round" d="M9 10l1.5 2 1-6 2 8 1.5-6 7 4" />
            </svg>
          </button>
          <button @click.stop="toggleMinimize" class="transition-all hover:scale-125">
            <svg viewBox="0 0 24 24" class="w-4 h-4 fill-none stroke-current stroke-2">
              <path d="M18 15l-6-6-6 6"/>
            </svg>
          </button>
        </div>
      </div>

      <div v-if="isSetting" class="flex-1 flex flex-col justify-center space-y-3 py-2">
        <div class="text-[9px] text-purple-400 uppercase tracking-widest font-black">Endpoint</div>
        <input 
          v-model="serverUrlInput" 
          type="text" 
          @mousedown.stop
          placeholder="https://..."
          class="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-[10px] focus:outline-none focus:border-purple-500/50 text-white placeholder:text-gray-600 transition-all"
        />
        <button @click="saveServerUrl" class="w-full py-2 bg-purple-600/40 hover:bg-purple-600/60 border border-purple-500/30 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">Deploy</button>
      </div>

      <div v-else class="flex-1 flex flex-col justify-center space-y-3">
        <div v-if="!isSyncing" class="space-y-3">
          <input 
            v-model="roomInput" 
            type="text" 
            @mousedown.stop
            maxlength="8"
            placeholder="CODE"
            class="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-white/40 text-white text-center tracking-[0.3em] uppercase font-mono"
          />
          <div class="grid grid-cols-2 gap-2">
            <button @click="handleJoin('private')" class="py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-[10px] font-black uppercase transition-all active:scale-95">2P</button>
            <button @click="handleJoin('public')" class="py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-[10px] font-black uppercase transition-all active:scale-95">Multi</button>
          </div>
        </div>
        <div v-else class="flex flex-col items-center justify-center space-y-2 py-4 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-xl">
          <div class="text-[8px] text-purple-400 uppercase tracking-[0.5em] font-black">Quantum Room</div>
          <div class="text-lg font-mono font-black text-white tracking-[0.3em]">{{ roomId }}</div>
          <button @click="leaveRoom" class="text-[8px] text-red-500 font-black hover:text-red-400 uppercase tracking-widest mt-1">Disconnect</button>
        </div>
      </div>

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
const isMinimized = ref(true); // 默认收起
const serverUrlInput = ref('');

const position = ref({ x: 16, y: 96 });
const isDragging = ref(false);
const dragOffset = ref({ x: 0, y: 0 });
let dragStartTime = 0;

const panelStyle = computed(() => {
  const style: any = {
    left: `${position.value.x}px`,
    bottom: `${position.value.y}px`,
    transition: isDragging.value ? 'none' : 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)'
  };

  if (isMinimized.value) {
    style.width = '100px'; 
    style.height = '100px';
    style.background = 'transparent';
    style.border = 'none';
    style.boxShadow = 'none';
    style.overflow = 'visible';
  } else {
    style.width = '180px';
    style.height = '180px';
    style.resize = 'both';
    style.minWidth = '160px';
    style.minHeight = '160px';
    style.background = '#000';
  }
  return style;
});

const handleMouseDown = (e: MouseEvent) => {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLButtonElement) return;
  
  isDragging.value = true;
  dragStartTime = Date.now();
  
  dragOffset.value = {
    x: e.clientX - position.value.x,
    y: (window.innerHeight - e.clientY) - position.value.y
  };
  
  const handleMouseMove = (moveEvent: MouseEvent) => {
    if (isDragging.value) {
      position.value = {
        x: moveEvent.clientX - dragOffset.value.x,
        y: (window.innerHeight - moveEvent.clientY) - dragOffset.value.y
      };
    }
  };

  const handleMouseUp = () => {
    setTimeout(() => {
      isDragging.value = false;
    }, 100);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};

const handleBallClick = () => {
  const duration = Date.now() - dragStartTime;
  if (duration < 200) {
    toggleMinimize();
  }
};

onMounted(() => {
  serverUrlInput.value = window.localStorage.getItem('SYNC_SERVER_URL') || '';
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
.dragging-active {
  transition: none !important;
}

/* 音符从耳机左侧飘出 */
@keyframes note-float-left {
  0% { transform: translate(0, 0) scale(0.5); opacity: 0; }
  20% { opacity: 1; }
  100% { transform: translate(-40px, -60px) rotate(-45deg) scale(1.2); opacity: 0; }
}
/* 音符从耳机右侧飘出 */
@keyframes note-float-right {
  0% { transform: translate(0, 0) scale(0.5); opacity: 0; }
  20% { opacity: 1; }
  100% { transform: translate(40px, -60px) rotate(45deg) scale(1.2); opacity: 0; }
}
/* 音符从头顶稍微飘出 */
@keyframes note-float-top {
  0% { transform: translate(0, 0) scale(0.5); opacity: 0; }
  20% { opacity: 1; }
  100% { transform: translate(0, -80px) rotate(15deg) scale(1.5); opacity: 0; }
}

@keyframes headphone-vibrate {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}

@keyframes pingu-sway {
  0%, 100% { transform: rotate(-3deg) translateY(2px); }
  50% { transform: rotate(3deg) translateY(-2px); }
}

.animate-note-float-left { animation: note-float-left 3s infinite ease-out; }
.animate-note-float-right { animation: note-float-right 3.5s infinite ease-out; }
.animate-note-float-top { animation: note-float-top 4s infinite ease-out; }
.animate-headphone-vibrate { animation: headphone-vibrate 0.4s infinite ease-in-out; transform-origin: center; }
.animate-pingu-sway { animation: pingu-sway 0.8s infinite ease-in-out; }

.animate-fade-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
</style>

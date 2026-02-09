<template>
  <div 
    ref="panelRef"
    class="sync-room-control fixed z-[9999] select-none"
    :style="panelStyle"
    :class="{ 
      'rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/20 overflow-hidden transition-all duration-700': !isMinimized, 
      'overflow-visible': isMinimized,
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
        <!-- 强化炫彩渐变：增加更多颜色变化 -->
        <linearGradient id="headphone-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#ff00ff;stop-opacity:1">
            <animate attributeName="stop-color" values="#ff00ff;#7000ff;#00ffff;#ff00ff" dur="4s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" style="stop-color:#00ffff;stop-opacity:1">
            <animate attributeName="stop-color" values="#00ffff;#ff00ff;#7000ff;#00ffff" dur="4s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
        <!-- 为心电图准备的亮紫色 -->
        <linearGradient id="ekg-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#e8d5ff;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#d8b4fe;stop-opacity:1" />
        </linearGradient>
      </defs>
    </svg>

    <!-- 面板背景层 (展开模式) -->
    <div v-if="!isMinimized" class="absolute inset-0 z-0">
      <img src="@/assets/sync/bg.jpg" class="w-full h-full object-cover grayscale-[0.2] opacity-60" />
      <div class="absolute inset-0 bg-gradient-to-br from-black/95 via-black/80 to-black/95 backdrop-blur-md"></div>
    </div>

    <!-- 究极进化悬浮球 (收起模式) -->
    <div 
      v-if="isMinimized" 
      @click="handleBallClick"
      class="relative z-20 w-16 h-16 flex items-center justify-center cursor-pointer group overflow-visible transition-transform duration-300 hover:scale-105"
    >
      <!-- 动态浮动音符 -->
      <div class="absolute inset-0 flex items-center justify-center overflow-visible pointer-events-none">
        <svg v-for="i in 3" :key="i" viewBox="0 0 24 24" :class="['absolute w-5 h-5 fill-current opacity-80 mix-blend-screen', isPlay ? `animate-note-float-${i}` : 'opacity-20']" :style="{ color: i === 1 ? '#c084fc' : (i === 2 ? '#6366f1' : '#ec4899') }">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
        </svg>
      </div>
      
      <!-- 外挂式加大号渐变耳机 - X轴正向偏移(+5)，尺寸增加 -->
      <svg viewBox="0 0 120 100" class="absolute inset-[-20px] w-[140%] h-[140%] pointer-events-none z-30 transition-all duration-500" :class="{ 'animate-headphone-vibrate': isPlay }">
        <!-- 耳机梁：包裹在球体外部，X轴向右平移 -->
        <path d="M25 50 A 38 38 0 0 1 95 50" fill="none" stroke="url(#headphone-gradient)" stroke-width="8" stroke-linecap="round" class="drop-shadow-[0_0_10px_rgba(192,132,252,0.6)]" />
        <!-- 左右耳罩：X轴向右平移 -->
        <rect x="15" y="38" width="16" height="30" rx="7" fill="url(#headphone-gradient)" class="drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
        <rect x="89" y="38" width="16" height="30" rx="7" fill="url(#headphone-gradient)" class="drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
      </svg>

      <!-- Pingu 头部 (充满圆球) -->
      <div class="relative w-12 h-11 rounded-full overflow-hidden border-2 border-white/30 shadow-2xl bg-black/40 backdrop-blur-sm z-20 transition-transform duration-500">
        <img src="@/assets/sync/pingu_head_v2.png" class="w-full h-full object-cover scale-[2.0] translate-y-2" :class="{ 'animate-pingu-pulse': isPlay }" />
      </div>
    </div>

    <!-- 完整面板模式 -->
    <div v-else class="relative z-10 h-full flex flex-col justify-between p-4 text-white animate-fade-in">
      <div class="flex items-center justify-between cursor-move drag-handle">
        <div class="flex items-center space-x-2">
          <div :class="['w-2 h-2 rounded-full shadow-lg transition-all duration-500', isSyncing ? 'bg-green-400 shadow-[0_0_10px_#4ade80]' : 'bg-gray-500']"></div>
          <span class="text-[10px] font-black tracking-[0.2em] uppercase opacity-90">{{ isSyncing ? 'Linked' : 'Sync' }}</span>
        </div>
        <div class="flex items-center space-x-3">
          <!-- “心动同步”音符切换按钮 -->
          <button @click.stop="toggleSettings" class="transition-all hover:scale-125 active:rotate-12">
            <svg viewBox="0 0 24 24" class="w-5 h-5">
              <!-- 左侧音符 -->
              <path fill="url(#note-gradient)" d="M7 16a2 2 0 1 1-2-2 2 2 0 0 1 2 2zM7 14V5" />
              <!-- 右侧音符 -->
              <path fill="url(#note-gradient)" d="M19 16a2 2 0 1 1-2-2 2 2 0 0 1 2 2zM19 14V7" />
              <!-- 心电图连接线 -->
              <path fill="none" stroke="url(#ekg-gradient)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M7 8l2 2 1-4 2 6 1-4 6 3" />
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
          class="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-[10px] focus:outline-none focus:border-purple-500/50 text-white"
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
            <button @click="handleJoin('private')" class="py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-[10px] font-black uppercase">2P</button>
            <button @click="handleJoin('public')" class="py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-[10px] font-black uppercase">Multi</button>
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
const isMinimized = ref(false);
const serverUrlInput = ref('');

const position = ref({ x: 16, y: 96 });
const isDragging = ref(false);
const dragOffset = ref({ x: 0, y: 0 });

const panelStyle = computed(() => {
  const style: any = {
    left: `${position.value.x}px`,
    bottom: `${position.value.y}px`
  };

  if (isMinimized.value) {
    style.width = '64px'; 
    style.height = '64px';
    style.borderRadius = '50%';
    style.padding = '0';
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
    isDragging.value = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};

const handleBallClick = (e: MouseEvent) => {
  if (!isDragging.value) {
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
  cursor: grabbing !important;
}

@keyframes note-float-1 {
  0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
  33% { transform: translate(-25px, -25px) rotate(-30deg) scale(1.4); }
  66% { transform: translate(20px, -40px) rotate(30deg) scale(0.7); }
}
@keyframes note-float-2 {
  0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
  33% { transform: translate(25px, -20px) rotate(20deg) scale(1.3); }
  66% { transform: translate(-15px, -45px) rotate(-20deg) scale(0.8); }
}
@keyframes note-float-3 {
  0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
  33% { transform: translate(0, -35px) rotate(-15deg) scale(1.5); }
  66% { transform: translate(25px, -30px) rotate(15deg) scale(0.6); }
}

@keyframes headphone-vibrate {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

@keyframes pingu-pulse {
  0%, 100% { transform: scale(2.0) translateY(10px); }
  50% { transform: scale(2.1) translateY(8px); }
}

.animate-note-float-1 { animation: note-float-1 4s infinite ease-in-out; }
.animate-note-float-2 { animation: note-float-2 5s infinite ease-in-out; }
.animate-note-float-3 { animation: note-float-3 3.5s infinite ease-in-out; }
.animate-headphone-vibrate { animation: headphone-vibrate 0.4s infinite ease-in-out; transform-origin: center; }
.animate-pingu-pulse { animation: pingu-pulse 0.4s infinite ease-in-out; }

.animate-fade-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
</style>

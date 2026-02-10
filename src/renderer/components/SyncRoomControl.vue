<template>
  <div
    ref="panelRef"
    class="sync-room-control fixed z-[10001] select-none transition-all duration-700 ease-in-out"
    :style="panelStyle"
    :class="{
      'rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/20': !isMinimized,
      'bg-transparent border-none': isMinimized,
      'dragging-active': isDragging
    }"
  >
    <!-- 渐变定义 -->
    <svg width="0" height="0" class="absolute">
      <defs>
        <linearGradient id="note-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color: #c084fc; stop-opacity: 1" />
          <stop offset="100%" style="stop-color: #6366f1; stop-opacity: 1" />
        </linearGradient>
        <linearGradient id="headphone-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color: #ff00ff; stop-opacity: 1">
            <animate attributeName="stop-color" values="#ff00ff;#7000ff;#00ffff;#ff00ff" dur="4s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" style="stop-color: #00ffff; stop-opacity: 1">
            <animate attributeName="stop-color" values="#00ffff;#ff00ff;#7000ff;#00ffff" dur="4s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>
    </svg>

    <!-- 面板背景层 -->
    <div v-if="!isMinimized" class="absolute inset-0 z-0 overflow-hidden rounded-2xl">
      <img src="@/assets/sync/bg.jpg" class="w-full h-full object-cover grayscale-[0.2]" :class="theme === 'dark' ? 'opacity-60' : 'opacity-30'" />
      <div class="absolute inset-0 backdrop-blur-md" :class="theme === 'dark' ? 'bg-black/80' : 'bg-white/80'"></div>
    </div>

    <!-- 表情包浮动气泡层 (全局) -->
    <div class="absolute inset-0 pointer-events-none overflow-visible z-[60]">
      <div v-for="bubble in activeBubbles" :key="bubble.id" class="absolute bubble-animation" :style="{ left: bubble.x + 'px', bottom: bubble.y + 'px', '--drift': bubble.drift + 'px' }">
        <div class="w-14 h-14 rounded-full overflow-hidden border-2 border-white/60 shadow-lg bg-white/30 backdrop-blur-md flex items-center justify-center p-1">
          <img :src="getEmojiUrl(bubble.emojiId)" class="w-full h-full object-contain rounded-full" />
        </div>
      </div>
    </div>

    <!-- Pingu 听歌形态 (收起模式) -->
    <div
      v-if="isMinimized"
      @mousedown="handleMouseDown"
      @click="handleBallClick"
      @contextmenu.prevent="toggleEmojiPicker"
      class="relative z-20 w-24 h-24 flex items-center justify-center cursor-pointer group overflow-visible transition-transform duration-300 hover:scale-105"
    >
      <!-- 表情包选择器 (收起模式右侧) -->
      <div v-if="showEmojiPicker" class="absolute left-24 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-3xl p-4 rounded-[2.5rem] border border-white/30 shadow-2xl grid grid-cols-3 gap-3 animate-ball-pop-right" @mousedown.stop>
        <div v-for="id in 12" :key="id" @click="sendEmoji(id)" class="w-10 h-10 rounded-full overflow-hidden cursor-pointer hover:scale-125 transition-all border-2 border-white/20 bg-white/10">
          <img :src="getEmojiUrl(id)" class="w-full h-full object-cover" />
        </div>
      </div>

      <div class="relative w-16 h-16 flex items-center justify-center z-20 transition-transform duration-500 -translate-x-2" :class="{ 'animate-pingu-sway': isPlay }">
        <img src="@/assets/sync/pingu_head_v2.png" class="w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" />
        <svg viewBox="0 0 100 100" class="absolute -left-[15%] top-[-25%] w-[130%] h-[130%] pointer-events-none z-30 transition-all duration-500" :class="[isPlay ? 'animate-headphone-vibrate' : '-translate-x-[1.5px]']">
          <path d="M22 50 A 28 28 0 0 1 78 50" fill="none" stroke="url(#headphone-gradient)" stroke-width="7" stroke-linecap="round" />
          <rect x="12" y="45" width="12" height="24" rx="6" fill="url(#headphone-gradient)" />
          <rect x="76" y="45" width="12" height="24" rx="6" fill="url(#headphone-gradient)" />
        </svg>
      </div>
    </div>

    <!-- 完整面板模式 -->
    <div v-else class="relative z-10 h-full flex flex-col p-4 animate-fade-in" :class="theme === 'dark' ? 'text-white' : 'text-gray-900'">
      <!-- 头部拖拽手柄 -->
      <div @mousedown="handleMouseDown" class="flex items-center justify-between cursor-move drag-handle border-b border-white/10 pb-2 mb-2">
        <div class="flex items-center space-x-1">
          <div :class="['w-2 h-2 rounded-full', isSyncing ? 'bg-green-400 shadow-[0_0_8px_#4ade80]' : 'bg-gray-400']"></div>
          <span class="text-[10px] font-bold tracking-tighter opacity-80 uppercase">{{ isSyncing ? 'Linked' : 'Sync' }}</span>
        </div>
        <div class="flex items-center space-x-2">
          <button @click.stop="openDevTools" class="p-1 rounded-md bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 transition-all">
            <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-current text-blue-400"><path d="M12.89 3L14.85 3.4L11.11 21L9.15 20.6L12.89 3M7.11 17L1.4 12L7.11 7L8.53 8.42L4.25 12L8.53 15.58L7.11 17M16.89 17L15.47 15.58L19.75 12L15.47 8.42L16.89 7L22.6 12L16.89 17Z" /></svg>
          </button>
          <button @click.stop="toggleEmojiPicker" class="p-1 rounded-md bg-yellow-400/20 hover:bg-yellow-400/30 border border-yellow-400/30 transition-all">
            <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-current text-yellow-500"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10V9H7v2zm0 4h10v-2H7v2z" /></svg>
          </button>
          <button @click.stop="toggleSettings" class="hover:rotate-45 transition-all">
            <svg viewBox="0 0 24 24" class="w-4 h-4"><circle fill="url(#note-gradient)" cx="5" cy="18" r="4" /><path fill="url(#note-gradient)" d="M8 18V5h1.5v13H8z" /><circle fill="url(#note-gradient)" cx="19" cy="18" r="4" /><path fill="url(#note-gradient)" d="M22 18V7h1.5v11H22z" /></svg>
          </button>
          <button @click.stop="toggleMinimize" class="hover:translate-y-[-2px] transition-all"><svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-none stroke-current stroke-2"><path d="M18 15l-6-6-6 6" /></svg></button>
        </div>
      </div>

      <!-- 可滚动内容区 -->
      <div class="flex-1 overflow-y-auto custom-scrollbar pr-1">
        <div v-if="showEmojiPicker" class="grid grid-cols-3 gap-3 py-2 animate-panel-pop">
          <div v-for="id in 12" :key="id" @click="sendEmoji(id)" class="w-12 h-12 rounded-full overflow-hidden cursor-pointer hover:scale-110 transition-all border border-white/20 shadow-md bg-white/5">
            <img :src="getEmojiUrl(id)" class="w-full h-full object-cover" />
          </div>
        </div>

        <div v-else-if="isSetting" class="flex flex-col space-y-3 pt-2">
          <div class="text-[8px] text-purple-500 font-bold uppercase tracking-widest">Server URL</div>
          <input v-model="serverUrlInput" type="text" @mousedown.stop placeholder="https://..." class="w-full border rounded-lg px-2 py-2 text-[10px] bg-white/10 border-white/30" />
          <button @click="saveServerUrl" class="w-full py-2 bg-purple-500 text-white rounded-lg text-[10px] font-bold uppercase">Save</button>
        </div>

        <div v-else class="flex flex-col space-y-3 pt-2">
          <div v-if="!isSyncing" class="space-y-3">
            <input v-model="roomInput" type="text" @mousedown.stop maxlength="8" placeholder="Room Code" class="w-full border rounded-lg px-2 py-2 text-xs text-center font-mono bg-white/10 border-white/30" />
            <div class="grid grid-cols-2 gap-2">
              <button @click="handleJoin('private')" class="py-2 bg-black/10 hover:bg-black/20 rounded-lg text-[10px] font-bold">PRIVATE</button>
              <button @click="handleJoin('public')" class="py-2 bg-black/10 hover:bg-black/20 rounded-lg text-[10px] font-bold">PUBLIC</button>
            </div>
          </div>
          <div v-else class="flex flex-col items-center justify-center space-y-2 py-4 rounded-xl border bg-white/20 border-white/10 backdrop-blur-xl">
            <div class="text-[8px] text-purple-500 font-bold uppercase">Room ID</div>
            <div class="text-lg font-mono font-bold tracking-widest">{{ roomId }}</div>
            <button @click="leaveRoom" class="text-[10px] text-red-500 font-bold uppercase mt-1">Disconnect</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { usePlayerStore } from '@/store/modules/player';
import { useSettingsStore } from '@/store/modules/settings';
import { useSyncStore } from '@/store/modules/sync';

const { t } = useI18n();
const syncStore = useSyncStore();
const playerStore = usePlayerStore();
const settingsStore = useSettingsStore();
const { isSyncing, roomId, receivedEmoji } = storeToRefs(syncStore);
const { isPlay } = storeToRefs(playerStore);
const { theme } = storeToRefs(settingsStore);

const roomInput = ref('');
const isSetting = ref(false);
const isMinimized = ref(true);
const serverUrlInput = ref('');
const showEmojiPicker = ref(false);
const activeBubbles = ref<any[]>([]);

const position = ref({ x: 16, y: 96 });
const isDragging = ref(false);
const dragOffset = ref({ x: 0, y: 0 });
let dragStartTime = 0;

const getEmojiUrl = (id: number) => new URL(`../assets/sync/emojis/emoji-${id}.png`, import.meta.url).href;

const sendEmoji = (id: number) => {
  syncStore.sendSync('send_emoji', { emojiId: id });
  triggerBubble(id);
  showEmojiPicker.value = false;
};

const triggerBubble = (emojiId: number) => {
  const id = Date.now() + Math.random();
  const bubble = { id, emojiId, x: position.value.x + (isMinimized.value ? 20 : 60), y: position.value.y + (isMinimized.value ? 40 : 100), drift: (Math.random() - 0.5) * 150 };
  activeBubbles.value.push(bubble);
  setTimeout(() => { activeBubbles.value = activeBubbles.value.filter(b => b.id !== id); }, 3500);
};

const openDevTools = () => {
  // @ts-ignore
  if (window.ipcRenderer) window.ipcRenderer.send('open-dev-tools');
};

watch(receivedEmoji, (newVal) => { if (newVal) triggerBubble(newVal.id); });

const panelStyle = computed(() => {
  const style: any = {
    left: `${position.value.x}px`,
    bottom: `${position.value.y}px`,
    transition: isDragging.value ? 'none' : 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
    overflow: isMinimized.value ? 'visible' : 'hidden'
  };
  if (isMinimized.value) {
    style.width = '100px'; style.height = '100px';
  } else {
    style.width = '240px'; style.height = '320px';
  }
  return style;
});

const handleMouseDown = (e: MouseEvent) => {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLButtonElement) return;
  isDragging.value = true;
  dragStartTime = Date.now();
  dragOffset.value = { x: e.clientX - position.value.x, y: window.innerHeight - e.clientY - position.value.y };
  const handleMouseMove = (moveEvent: MouseEvent) => {
    if (isDragging.value) {
      position.value = { x: moveEvent.clientX - dragOffset.value.x, y: window.innerHeight - moveEvent.clientY - dragOffset.value.y };
    }
  };
  const handleMouseUp = () => {
    setTimeout(() => { isDragging.value = false; }, 50);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};

const handleBallClick = () => {
  const duration = Date.now() - dragStartTime;
  if (duration < 200) {
    if (showEmojiPicker.value) showEmojiPicker.value = false;
    else toggleMinimize();
  }
};

const toggleEmojiPicker = () => { showEmojiPicker.value = !showEmojiPicker.value; isSetting.value = false; };
onMounted(() => { serverUrlInput.value = window.localStorage.getItem('SYNC_SERVER_URL') || ''; });
const toggleMinimize = () => { isMinimized.value = !isMinimized.value; isSetting.value = false; showEmojiPicker.value = false; };
const toggleSettings = () => { isSetting.value = !isSetting.value; showEmojiPicker.value = false; };
const saveServerUrl = () => { window.localStorage.setItem('SYNC_SERVER_URL', serverUrlInput.value); isSetting.value = false; window.location.reload(); };
const handleJoin = (type: 'private' | 'public') => {
  if (!roomInput.value) roomInput.value = Math.random().toString(36).substring(7).toUpperCase();
  syncStore.initSync(roomInput.value, type);
};
const leaveRoom = () => { syncStore.leaveRoom(); roomInput.value = ''; };
</script>

<style scoped>
.dragging-active { transition: none !important; }
@keyframes bubble-float {
  0% { transform: translateY(0) scale(0.3) rotate(0); opacity: 0; }
  15% { opacity: 1; transform: translateY(-30px) scale(1.1) rotate(15deg); }
  100% { transform: translateY(-350px) translateX(var(--drift)) scale(0.8) rotate(-30deg); opacity: 0; }
}
.bubble-animation { animation: bubble-float 3.5s cubic-bezier(0.2, 0.8, 0.4, 1) forwards; }
@keyframes ball-pop-right { 0% { transform: translate(-20px, -50%) scale(0.7); opacity: 0; } 100% { transform: translate(0, -50%) scale(1); opacity: 1; } }
.animate-ball-pop-right { animation: ball-pop-right 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
@keyframes panel-pop { 0% { transform: translateY(10px) scale(0.95); opacity: 0; } 100% { transform: translateY(0) scale(1); opacity: 1; } }
.animate-panel-pop { animation: panel-pop 0.3s ease-out forwards; }

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.4); }

@keyframes headphone-vibrate { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
@keyframes pingu-sway { 0%, 100% { transform: rotate(-3deg) translateY(2px); } 50% { transform: rotate(3deg) translateY(-2px); } }
.animate-headphone-vibrate { animation: headphone-vibrate 0.4s infinite ease-in-out; }
.animate-pingu-sway { animation: pingu-sway 0.8s infinite ease-in-out; }
.animate-fade-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
</style>
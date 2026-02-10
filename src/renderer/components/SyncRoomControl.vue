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
    <!-- 渐变与滤镜定义 -->
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
    <div class="absolute inset-0 pointer-events-none overflow-visible z-[100]">
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
      <!-- 环形表情选择器 (缩小版，置于右侧) -->
      <div v-if="showEmojiPicker" class="absolute left-[110%] top-1/2 -translate-y-1/2 w-48 h-48 z-[70] animate-picker-pop-right" @mousedown.stop>
        <div class="absolute inset-0 bg-white/15 backdrop-blur-2xl rounded-full border border-white/25 shadow-[0_16px_32px_rgba(0,0,0,0.2)]"></div>
        <div @click="sendEmoji(selectedEmojiId)" class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-white/10 border-2 border-white/30 shadow-inner flex items-center justify-center cursor-pointer group/center transition-all duration-300 hover:scale-110 active:scale-95 z-20">
          <img :src="getEmojiUrl(selectedEmojiId)" class="w-14 h-14 object-contain drop-shadow-lg" />
          <div class="absolute inset-0 opacity-0 group-hover/center:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div class="w-full h-full bg-blue-400/50 backdrop-blur-[2px] rounded-full flex items-center justify-center border-2 border-blue-200/60 animate-jelly shadow-[0_0_12px_rgba(59,130,246,0.5)]">
              <svg viewBox="0 0 100 100" class="w-10 h-10 fill-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]"><path d="M50,45c-11,0-20,9-20,20s9,20,20,20s20-9,20-20S61,45,50,45z M25,40c-4.4,0-8,3.6-8,8s3.6,8,8,8s8-3.6,8-8S29.4,40,25,40z M40,20c-4.4,0-8,3.6-8,8s3.6,8,8,8s8-3.6,8-8S44.4,20,40,20z M60,20c-4.4,0-8,3.6-8,8s3.6,8,8,8s8-3.6,8-8S64.4,20,60,20z M75,40c-4.4,0-8,3.6-8,8s3.6,8,8,8s8-3.6,8-8S79.4,40,75,40z" /></svg>
            </div>
          </div>
        </div>
        <div v-for="id in 12" :key="id" @mouseenter="handleEmojiHover(id)" class="absolute left-1/2 top-1/2 w-9 h-9 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out cursor-pointer hover:scale-125 z-10" :style="getOrbitStyle(id - 1, 72)" :class="{ 'opacity-30 grayscale-[0.3] scale-90': id !== selectedEmojiId }">
          <div class="w-full h-full rounded-full bg-white/20 border border-white/40 shadow-sm backdrop-blur-md flex items-center justify-center overflow-hidden"><img :src="getEmojiUrl(id)" class="w-7 h-7 object-contain" /></div>
        </div>
      </div>

      <!-- Pingu 身体 + 耳机 -->
      <div class="relative w-16 h-16 flex items-center justify-center z-20 transition-transform duration-500 -translate-x-2" :class="{ 'animate-pingu-sway': isPlay }">
        <img src="@/assets/sync/pingu_head_v2.png" class="w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" />
        <!-- 还原的大耳机 -->
        <svg viewBox="0 0 100 100" class="absolute -left-[15%] top-[-25%] w-[130%] h-[130%] pointer-events-none z-30 transition-all duration-500" :class="[isPlay ? 'animate-headphone-vibrate' : '-translate-x-[1.5px]']">
          <path d="M22 50 A 28 28 0 0 1 78 50" fill="none" stroke="url(#headphone-gradient)" stroke-width="7" stroke-linecap="round" class="drop-shadow-[0_0_8px_rgba(192,132,252,0.6)]" />
          <rect x="12" y="45" width="12" height="24" rx="6" fill="url(#headphone-gradient)" class="drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]" />
          <rect x="76" y="45" width="12" height="24" rx="6" fill="url(#headphone-gradient)" class="drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]" />
        </svg>
      </div>

      <!-- 还原的浮动音符粒子 -->
      <div class="absolute inset-0 overflow-visible pointer-events-none z-40">
        <svg viewBox="0 0 24 24" :class="['absolute w-5 h-5 fill-current mix-blend-screen', isPlay ? 'animate-note-float-left' : 'opacity-0']" style="left: 10%; top: 40%; color: #c084fc"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" /></svg>
        <svg viewBox="0 0 24 24" :class="['absolute w-5 h-5 fill-current mix-blend-screen', isPlay ? 'animate-note-float-right' : 'opacity-0']" style="right: 10%; top: 40%; color: #6366f1"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" /></svg>
        <svg viewBox="0 0 24 24" :class="['absolute w-4 h-4 fill-current mix-blend-screen', isPlay ? 'animate-note-float-top' : 'opacity-0']" style="left: 48%; top: 15%; color: #ec4899"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" /></svg>
      </div>
    </div>

    <!-- 完整面板模式 -->
    <div v-else class="relative z-10 h-full flex flex-col p-4 animate-fade-in" :class="theme === 'dark' ? 'text-white' : 'text-gray-900'">
      <div @mousedown="handleMouseDown" class="flex items-center justify-between cursor-move drag-handle border-b border-white/10 pb-2 mb-2">
        <div class="flex items-center space-x-1">
          <div :class="['w-2 h-2 rounded-full', isSyncing ? 'bg-green-400 shadow-[0_0_8px_#4ade80]' : 'bg-gray-400']"></div>
          <span class="text-[10px] font-bold tracking-tighter opacity-80 uppercase">{{ isSyncing ? 'Linked' : 'Sync' }}</span>
        </div>
        <div class="flex items-center space-x-2">
          <button @click.stop="openDevTools" class="p-1 rounded-md bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 transition-all"><svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-current text-blue-400"><path d="M12.89 3L14.85 3.4L11.11 21L9.15 20.6L12.89 3M7.11 17L1.4 12L7.11 7L8.53 8.42L4.25 12L8.53 15.58L7.11 17M16.89 17L15.47 15.58L19.75 12L15.47 8.42L16.89 7L22.6 12L16.89 17Z" /></svg></button>
          <button @click.stop="toggleEmojiPicker" class="p-1 rounded-md bg-yellow-400/20 hover:bg-yellow-400/30 border border-yellow-400/30 transition-all"><svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-current text-yellow-500"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10V9H7v2zm0 4h10v-2H7v2z" /></svg></button>
          <button @click.stop="toggleMinimize" class="hover:translate-y-[-2px] transition-all"><svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-none stroke-current stroke-2"><path d="M18 15l-6-6-6 6" /></svg></button>
        </div>
      </div>

      <div class="flex-1 relative flex items-center justify-center overflow-visible">
        <div v-if="showEmojiPicker" class="relative w-full h-full flex items-center justify-center animate-picker-fade-in">
          <div class="absolute w-32 h-32 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm"></div>
          <div @click="sendEmoji(selectedEmojiId)" class="relative z-20 w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center cursor-pointer group/pan transition-all hover:scale-110 shadow-lg">
            <img :src="getEmojiUrl(selectedEmojiId)" class="w-12 h-12 object-contain" />
            <div class="absolute inset-0 opacity-0 group-hover/pan:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div class="w-full h-full bg-blue-500/30 backdrop-blur-[1px] rounded-full border border-blue-400/40 animate-jelly">
                <svg viewBox="0 0 100 100" class="w-10 h-10 fill-white absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"><path d="M50,45c-11,0-20,9-20,20s9,20,20,20s20-9,20-20S61,45,50,45z M25,40c-4.4,0-8,3.6-8,8s3.6,8,8,8s8-3.6,8-8S29.4,40,25,40z M40,20c-4.4,0-8,3.6-8,8s3.6,8,8,8s8-3.6,8-8S44.4,20,40,20z M60,20c-4.4,0-8,3.6-8,8s3.6,8,8,8s8-3.6,8-8S64.4,20,60,20z M75,40c-4.4,0-8,3.6-8,8s3.6,8,8,8s8-3.6,8-8S79.4,40,75,40z" /></svg>
              </div>
            </div>
          </div>
          <div v-for="id in 12" :key="id" @mouseenter="handleEmojiHover(id)" class="absolute w-7 h-7 cursor-pointer transition-all duration-300 hover:scale-125 z-10" :style="getOrbitStyle(id - 1, 58)" :class="{ 'opacity-20 scale-75': id !== selectedEmojiId }">
            <div class="w-full h-full rounded-full bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center shadow-sm overflow-hidden"><img :src="getEmojiUrl(id)" class="w-5 h-5 object-contain" /></div>
          </div>
        </div>
        <div v-else-if="isSetting" class="w-full flex flex-col space-y-2">
          <input v-model="serverUrlInput" type="text" placeholder="Server URL" class="w-full border rounded-lg px-2 py-1.5 text-[10px] bg-white/20 border-white/30 text-white" />
          <button @click="saveServerUrl" class="w-full py-1.5 bg-purple-500 text-white rounded-lg text-[10px] font-bold">Save</button>
        </div>
        <div v-else class="w-full flex flex-col space-y-2">
          <input v-model="roomInput" type="text" maxlength="8" placeholder="Room Code" class="w-full border rounded-lg px-2 py-1.5 text-xs text-center font-mono bg-white/20 border-white/30 text-white" />
          <button v-if="!isSyncing" @click="handleJoin('private')" class="py-1.5 bg-purple-500/40 hover:bg-purple-500/60 rounded-lg text-[10px] font-bold">JOIN ROOM</button>
          <div v-else class="flex flex-col items-center py-2 bg-white/10 rounded-xl border border-white/10">
            <span class="text-[8px] opacity-50 uppercase">Room ID</span>
            <span class="text-base font-mono font-bold tracking-widest">{{ roomId }}</span>
            <button @click="leaveRoom" class="text-[9px] text-red-400 mt-1 uppercase font-bold">Disconnect</button>
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
const selectedEmojiId = ref(1);

const getOrbitStyle = (index: number, radius: number = 95) => {
  const angle = (index * 360) / 12;
  return { transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-${radius}px) rotate(-${angle}deg)` };
};

const handleEmojiHover = (id: number) => { selectedEmojiId.value = id; };

const position = ref({ x: 16, y: 96 });
const isDragging = ref(false);
const dragOffset = ref({ x: 0, y: 0 });
let dragStartTime = 0;

const getEmojiUrl = (id: number) => new URL(`../assets/sync/emojis/emoji-${id}.png`, import.meta.url).href;

const sendEmoji = (id: number) => {
  syncStore.sendSync('send_emoji', { emojiId: id });
  triggerBubble(id);
};

const triggerBubble = (emojiId: number) => {
  const id = Date.now() + Math.random();
  const bubble = { id, emojiId, x: position.value.x + (isMinimized.value ? 20 : 60), y: position.value.y + (isMinimized.value ? 40 : 100), drift: (Math.random() - 0.5) * 150 };
  activeBubbles.value.push(bubble);
  setTimeout(() => { activeBubbles.value = activeBubbles.value.filter(b => b.id !== id); }, 3500);
};

const openDevTools = () => { if (window.ipcRenderer) window.ipcRenderer.send('open-dev-tools'); };
watch(receivedEmoji, (newVal) => { if (newVal) triggerBubble(newVal.id); });

const panelStyle = computed(() => {
  const style: any = {
    left: `${position.value.x}px`, bottom: `${position.value.y}px`,
    transition: isDragging.value ? 'none' : 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
    overflow: isMinimized.value ? 'visible' : 'hidden'
  };
  if (isMinimized.value) { style.width = '100px'; style.height = '100px'; }
  else { style.width = '240px'; style.height = '320px'; }
  return style;
});

const handleMouseDown = (e: MouseEvent) => {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLButtonElement) return;
  isDragging.value = true; dragStartTime = Date.now();
  dragOffset.value = { x: e.clientX - position.value.x, y: window.innerHeight - e.clientY - position.value.y };
  const handleMouseMove = (moveEvent: MouseEvent) => {
    if (isDragging.value) position.value = { x: moveEvent.clientX - dragOffset.value.x, y: window.innerHeight - moveEvent.clientY - dragOffset.value.y };
  };
  const handleMouseUp = () => {
    setTimeout(() => { isDragging.value = false; }, 50);
    document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp);
  };
  document.addEventListener('mousemove', handleMouseMove); document.addEventListener('mouseup', handleMouseUp);
};

const handleBallClick = () => {
  const duration = Date.now() - dragStartTime;
  if (duration < 200) { if (showEmojiPicker.value) showEmojiPicker.value = false; else toggleMinimize(); }
};

const toggleEmojiPicker = () => { showEmojiPicker.value = !showEmojiPicker.value; isSetting.value = false; };
onMounted(() => { serverUrlInput.value = window.localStorage.getItem('SYNC_SERVER_URL') || ''; });
const toggleMinimize = () => { isMinimized.value = !isMinimized.value; isSetting.value = false; showEmojiPicker.value = false; };
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
@keyframes picker-pop-right { from { opacity: 0; transform: translateY(-50%) scale(0.7) translateX(-20px); } to { opacity: 1; transform: translateY(-50%) scale(1) translateX(0); } }
.animate-ball-pop-right { animation: picker-pop-right 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
@keyframes picker-fade-in { from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
.animate-picker-fade-in { animation: picker-fade-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
@keyframes jelly { 0%, 100% { transform: scale(1, 1); } 33% { transform: scale(1.15, 0.85); } 66% { transform: scale(0.85, 1.15); } }
.animate-jelly { animation: jelly 0.6s infinite ease-in-out; }

@keyframes note-float-left {
  0% { transform: translate(0, 0) scale(0.5); opacity: 0; }
  20% { opacity: 1; }
  100% { transform: translate(-40px, -60px) rotate(-45deg) scale(1.2); opacity: 0; }
}
@keyframes note-float-right {
  0% { transform: translate(0, 0) scale(0.5); opacity: 0; }
  20% { opacity: 1; }
  100% { transform: translate(40px, -60px) rotate(45deg) scale(1.2); opacity: 0; }
}
@keyframes note-float-top {
  0% { transform: translate(0, 0) scale(0.5); opacity: 0; }
  20% { opacity: 1; }
  100% { transform: translate(0, -80px) rotate(15deg) scale(1.5); opacity: 0; }
}
@keyframes headphone-vibrate { 0%, 100% { transform: translateX(-2px) scale(1); } 50% { transform: translateX(-2px) scale(1.08); } }
@keyframes pingu-sway { 0%, 100% { transform: rotate(-3deg) translateY(2px); } 50% { transform: rotate(3deg) translateY(-2px); } }

.animate-note-float-left { animation: note-float-left 3s infinite ease-out; }
.animate-note-float-right { animation: note-float-right 3.5s infinite ease-out; }
.animate-note-float-top { animation: note-float-top 4s infinite ease-out; }
.animate-headphone-vibrate { animation: headphone-vibrate 0.4s infinite ease-in-out; transform-origin: center; }
.animate-pingu-sway { animation: pingu-sway 0.8s infinite ease-in-out; }
.animate-fade-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
</style>
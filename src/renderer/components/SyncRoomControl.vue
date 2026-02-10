<template>
  <div
    ref="panelRef"
    id="sync-room-anchor"
    class="sync-room-control fixed z-[999999] select-none transition-all duration-700 ease-in-out bg-transparent"
    :style="[panelStyle, { transform: 'none !important' }]"
    :class="{
      'rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/20 overflow-hidden':
        !isMinimized,
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
            <animate
              attributeName="stop-color"
              values="#ff00ff;#7000ff;#00ffff;#ff00ff"
              dur="4s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="100%" style="stop-color: #00ffff; stop-opacity: 1">
            <animate
              attributeName="stop-color"
              values="#00ffff;#ff00ff;#7000ff;#00ffff"
              dur="4s"
              repeatCount="indefinite"
            />
          </stop>
        </linearGradient>
        <linearGradient id="ekg-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color: #e879f9" />
          <stop offset="50%" style="stop-color: #a855f7" />
          <stop offset="100%" style="stop-color: #6366f1" />
        </linearGradient>
      </defs>
    </svg>

    <!-- 1. 背景层 (全屏覆盖 & 磨砂感) -->
    <div
      v-if="!isMinimized"
      class="absolute inset-0 z-0 overflow-hidden rounded-2xl pointer-events-none bg-[#fdfcff] dark:bg-[#0f172a]"
    >
      <div class="absolute inset-0 flex items-center justify-center opacity-50 dark:opacity-20">
        <img
          src="@/assets/sync/pingu_bg.jpg"
          class="w-full h-full object-cover grayscale-[0.1] scale-105"
          style="transform: none !important;"
          draggable="false"
        />
      </div>
      <!-- 增加一层细腻的渐变，让中心更透亮 -->
      <div
        class="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/40 dark:from-black/20 dark:to-black/60"
      ></div>
      <div class="absolute inset-0 backdrop-blur-[3px]"></div>
    </div>

    <!-- 2. 表情包浮动气泡层 -->
    <div class="absolute inset-0 pointer-events-none overflow-visible z-[100]">
      <div
        v-for="bubble in activeBubbles"
        :key="bubble.id"
        class="absolute bubble-animation"
        :style="{ left: bubble.x + 'px', bottom: bubble.y + 'px', '--drift': bubble.drift + 'px' }"
      >
        <div
          class="w-14 h-14 rounded-full overflow-hidden border-2 border-blue-400/80 shadow-lg bg-blue-100/20 backdrop-blur-md flex items-center justify-center p-1"
        >
          <img
            :src="getEmojiUrl(bubble.emojiId)"
            class="w-full h-full object-contain rounded-full"
          />
        </div>
      </div>
    </div>

    <!-- 3. Pingu 听歌形态 (收起模式) -->
    <div
      v-if="isMinimized"
      @mousedown="handleMouseDown"
      @click="handleBallClick"
      @contextmenu.prevent="toggleEmojiPicker"
      class="relative z-20 w-full h-full flex items-center justify-center cursor-pointer group overflow-visible transition-transform duration-300 hover:scale-105"
    >
      <div class="absolute inset-0 pointer-events-none overflow-visible z-30">
        <div
          v-for="(queuedEmojiId, index) in emojiQueue.slice(0, 5)"
          :key="index"
          class="absolute w-8 h-8 rounded-full border-2 border-blue-400/50 bg-blue-100/30 backdrop-blur-sm overflow-hidden animate-queue-hover"
          :style="getQueuePosition(index)"
        >
          <img :src="getEmojiUrl(queuedEmojiId)" class="w-full h-full object-contain opacity-80" />
        </div>
        <div
          v-if="emojiQueue.length > 5"
          class="absolute -top-2 -right-2 bg-blue-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg border border-white"
        >
          +{{ emojiQueue.length - 5 }}
        </div>
      </div>

      <div
        v-if="showEmojiPicker"
        class="absolute left-[110%] top-1/2 -translate-y-1/2 w-48 h-48 z-[70] animate-picker-pop-right"
        @mousedown.stop
      >
        <div
          class="absolute inset-0 bg-white/15 backdrop-blur-2xl rounded-full border border-white/25 shadow-[0_16px_32px_rgba(0,0,0,0.2)]"
        ></div>
        <div
          @click="sendEmoji(selectedEmojiId)"
          class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-white/10 border-2 border-white/30 shadow-inner flex items-center justify-center cursor-pointer group/center transition-all duration-300 hover:scale-110 active:scale-95 z-20"
        >
          <img
            :src="getEmojiUrl(selectedEmojiId)"
            class="w-14 h-14 object-contain drop-shadow-lg"
          />
        </div>
        <div
          v-for="id in 12"
          :key="id"
          @mouseenter="handleEmojiHover(id)"
          class="absolute left-1/2 top-1/2 w-9 h-9 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out cursor-pointer hover:scale-125 z-10"
          :style="getOrbitStyle(id - 1, 72)"
          :class="{ 'opacity-30 grayscale-[0.3] scale-90': id !== selectedEmojiId }"
        >
          <div
            class="w-full h-full rounded-full bg-white/20 border border-white/40 shadow-sm backdrop-blur-md flex items-center justify-center overflow-hidden"
          >
            <img :src="getEmojiUrl(id)" class="w-7 h-7 object-contain" />
          </div>
        </div>
      </div>

      <div
        class="relative w-16 h-16 flex items-center justify-center z-20 transition-transform duration-500 -translate-x-2"
        :class="{ 'animate-pingu-sway': isPlay }"
      >
        <img
          src="@/assets/sync/pingu_head_v2.png"
          class="w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
        />
        <svg
          viewBox="0 0 100 100"
          class="absolute -left-[15%] top-[-25%] w-[130%] h-[130%] pointer-events-none z-30"
          :class="[isPlay ? 'animate-headphone-vibrate' : '-translate-x-[1.5px]']"
        >
          <path
            d="M22 50 A 28 28 0 0 1 78 50"
            fill="none"
            stroke="url(#headphone-gradient)"
            stroke-width="7"
            stroke-linecap="round"
          />
          <rect x="12" y="45" width="12" height="24" rx="6" fill="url(#headphone-gradient)" />
          <rect x="76" y="45" width="12" height="24" rx="6" fill="url(#headphone-gradient)" />
        </svg>
      </div>
    </div>

    <!-- 4. 完整面板模式 (展开) -->
    <div
      v-else
      class="relative z-10 h-full flex flex-col animate-fade-in"
      :class="theme === 'dark' ? 'text-white' : 'text-gray-900'"
    >
      <!-- 顶部状态栏 -->
      <div
        class="flex items-center justify-between border-b border-purple-100 dark:border-white/10 px-4 py-3 mb-2 w-full"
      >
        <div
          @mousedown="handleMouseDown"
          class="flex items-center space-x-2 cursor-move flex-1 h-full"
        >
          <div
            :class="[
              'w-2.5 h-2.5 rounded-full',
              isSyncing ? 'bg-green-400 shadow-[0_0_8px_#4ade80]' : 'bg-gray-300'
            ]"
          ></div>
          <span class="text-[11px] font-black tracking-tight opacity-70 uppercase">{{
            isSyncing ? t('sync.linked') : t('sync.sync')
          }}</span>
        </div>
        <div class="flex items-center space-x-2" @mousedown.stop>
          <button
            @click="toggleEmojiPicker"
            class="p-1.5 rounded-lg bg-yellow-400/10 hover:bg-yellow-400/20 border border-yellow-400/20 transition-all active:scale-95"
            :class="{ 'bg-yellow-400/40 shadow-inner': showEmojiPicker }"
          >
            <svg viewBox="0 0 24 24" class="w-4 h-4 fill-current text-yellow-500">
              <path
                d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10s10-4.47 10-10S17.53 2 12 2z M12,20c-4.41,0-8-3.59-8-8s3.59-8 8-8s8,3.59,8,8 S16.41,20,12,20z M7,9.5C7,8.67 7.67,8 8.5,8S10,8.67 10,9.5S9.33,11 8.5,11S7,10.33 7,9.5z M14,9.5c0-0.83 0.67-1.5 1.5-1.5 s1.5,0.67 1.5,1.5s-0.67,1.5-1.5,1.5S14,10.33 14,9.5z M12,17.5c-2.33,0-4.31-1.46-5.11-3.5h10.22C16.31,16.04 14.33,17.5 12,17.5z"
              />
            </svg>
          </button>
          <button
            @click="toggleSettings"
            class="p-1.5 rounded-lg hover:bg-purple-500/10 transition-all active:scale-95"
            :class="{ 'bg-purple-500/20 shadow-inner': isSetting }"
          >
            <svg viewBox="0 0 24 24" class="w-5 h-5 flex items-center justify-center mx-auto">
              <circle fill="url(#note-gradient)" cx="6" cy="18" r="3.5" />
              <circle fill="url(#note-gradient)" cx="18" cy="18" r="3.5" />
              <rect x="7.5" y="6" width="2.2" height="12" fill="url(#note-gradient)" />
              <rect x="19.5" y="6" width="2.2" height="12" fill="url(#note-gradient)" />
              <path
                fill="none"
                stroke="url(#ekg-gradient)"
                stroke-width="1.2"
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M8,10 L11,11 L12.5,6 L14,13 L16,9 L19,11"
              />
            </svg>
          </button>
          <button @click="toggleMinimize" class="p-1 hover:translate-y-[-2px] transition-all">
            <svg
              viewBox="0 0 24 24"
              class="w-4 h-4 fill-none stroke-current stroke-2"
              :class="theme === 'dark' ? 'stroke-white' : 'stroke-gray-900'"
            >
              <path d="M18 15l-6-6-6 6" />
            </svg>
          </button>
        </div>
      </div>

      <!-- 内容区 - 彻底重构居中逻辑 -->
      <div class="flex-1 overflow-hidden relative z-10 w-full">
        <!-- 1. 表情宫格 -->
        <div v-if="showEmojiPicker" class="grid grid-cols-3 gap-4 py-2 px-6 animate-panel-pop">
          <div
            v-for="id in 12"
            :key="id"
            @click="sendEmoji(id)"
            class="aspect-square rounded-2xl cursor-pointer hover:scale-110 transition-all border border-purple-100 dark:border-white/10 shadow-sm bg-white/40 dark:bg-white/5 active:scale-90 flex items-center justify-center"
          >
            <img :src="getEmojiUrl(id)" class="w-[80%] h-[80%] object-contain" />
          </div>
        </div>

        <!-- 2. 服务器设置面板 -->
        <div
          v-else-if="isSetting"
          class="flex flex-col items-center space-y-5 pt-6 px-4 w-full h-full"
        >
          <div
            class="text-[11px] text-purple-600 dark:text-purple-400 font-black uppercase tracking-[0.2em] text-center w-full"
          >
            {{ t('sync.endpoint') }}
          </div>
          <div class="flex justify-center w-full px-2">
            <input
              v-model="serverUrlInput"
              type="text"
              @mousedown.stop
              placeholder="https://..."
              class="w-full border-4 border-blue-500 rounded-xl px-4 py-3.5 text-[12px] font-bold text-center outline-none transition-all bg-white/70 text-gray-900 focus:border-blue-600 dark:bg-black/30 dark:text-white"
            />
          </div>
          <div class="flex justify-center w-full px-2">
            <button
              @click="saveServerUrl"
              class="w-full py-4 bg-purple-600 text-white rounded-xl text-[11px] font-black uppercase shadow-lg active:scale-95 transition-all border-2 border-white"
            >
              {{ t('sync.save') }}
            </button>
          </div>
        </div>

        <!-- 3. 同步主面板 -->
        <div v-else class="flex flex-col items-center space-y-6 pt-6 px-4 w-full h-full">
          <div v-if="!isSyncing" class="flex flex-col items-center space-y-6 w-full">
            <div
              class="text-[11px] text-purple-600 dark:text-purple-400 font-black uppercase tracking-[0.2em] text-center w-full px-2"
            >
              {{ t('sync.code') }}
            </div>
            <div class="flex justify-center w-full px-2">
              <input
                v-model="roomInput"
                type="text"
                @mousedown.stop
                maxlength="8"
                placeholder=""
                class="w-full border-2 rounded-xl px-2 py-5 text-3xl text-center font-black tracking-[0.6em] bg-white/80 border-purple-50 text-gray-900 focus:border-purple-200 dark:bg-black/40 dark:border-white/10 dark:text-white outline-none shadow-md"
              />
            </div>
            <div class="flex justify-center w-full px-2">
              <div class="grid grid-cols-2 gap-4 w-full">
                <button
                  @click="handleJoin('private')"
                  class="py-5 bg-gray-900 text-white dark:bg-white dark:text-black rounded-xl text-[10px] font-black uppercase shadow-xl active:scale-95 transition-all"
                >
                  {{ t('sync.privateRoom') }}
                </button>
                <button
                  @click="handleJoin('public')"
                  class="py-5 bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white rounded-xl text-[10px] font-black uppercase shadow-sm active:scale-95 transition-all"
                >
                  {{ t('sync.publicRoom') }}
                </button>
              </div>
            </div>
          </div>
          <div v-else class="flex flex-col items-center justify-center w-full h-full pb-10">
            <div
              class="flex flex-col items-center justify-center space-y-5 py-12 rounded-3xl border-2 bg-white/90 border-purple-100 dark:bg-black/60 dark:border-white/20 backdrop-blur-2xl w-full shadow-2xl"
            >
              <div
                class="text-[10px] text-purple-600 dark:text-purple-400 font-black uppercase tracking-[0.4em] text-center w-full"
              >
                {{ t('sync.quantumRoom') }}
              </div>
              <div
                class="text-5xl font-mono font-black tracking-[0.2em] text-gray-900 dark:text-white text-center w-full"
              >
                {{ roomId }}
              </div>
              <button
                @click="leaveRoom"
                class="text-[11px] text-red-500 font-black uppercase mt-6 hover:scale-110 transition-transform underline underline-offset-4"
              >
                {{ t('sync.disconnect') }}
              </button>
            </div>
          </div>
        </div>
      </div>
      <!-- 视觉标记 -->
      <div
        class="absolute bottom-2 left-1/2 -translate-x-1/2 text-[7px] opacity-20 font-mono pointer-events-none tracking-widest uppercase"
      >
        FIX-V5.0-ULTRA
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
const emojiQueue = ref<number[]>([]);

const position = ref({ x: 16, y: 96 });
const isDragging = ref(false);
const dragOffset = ref({ x: 0, y: 0 });
let dragStartTime = 0;

const panelStyle = computed(() => {
  return {
    left: `${position.value.x}px`,
    bottom: `${position.value.y}px`,
    width: isMinimized.value ? '96px' : '270px',
    height: isMinimized.value ? '96px' : '360px',
    display: 'flex'
  };
});

const getOrbitStyle = (index: number, radius: number = 95) => {
  const angle = (index * 360) / 12;
  return {
    transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-${radius}px) rotate(-${angle}deg)`
  };
};

const getQueuePosition = (index: number) => {
  const angles = [-45, -15, 15, 45, 0];
  const distances = [50, 60, 55, 52, 65];
  const angle = angles[index % 5];
  const dist = distances[index % 5];
  return {
    left: `calc(50% + ${Math.sin((angle * Math.PI) / 180) * dist}px)`,
    top: `calc(-10% - ${Math.cos((angle * Math.PI) / 180) * dist}px)`,
    transitionDelay: `${index * 0.1}s`
  };
};

const handleEmojiHover = (id: number) => {
  selectedEmojiId.value = id;
};
const getEmojiUrl = (id: number) =>
  new URL(`../assets/sync/emojis/emoji-${id}.png`, import.meta.url).href;

const sendEmoji = (id: number) => {
  syncStore.sendSync('send_emoji', { emojiId: id });
  triggerBubble(id);
};

watch(receivedEmoji, (newVal) => {
  if (newVal) {
    emojiQueue.value.push(newVal.id);
  }
});

const triggerBubble = (emojiId: number) => {
  const id = Date.now() + Math.random();
  const bubble = { id, emojiId, x: 40, y: 40, drift: (Math.random() - 0.5) * 150 };
  activeBubbles.value.push(bubble);
  setTimeout(() => {
    activeBubbles.value = activeBubbles.value.filter((b) => b.id !== id);
  }, 3500);
};

const handleMouseDown = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (target.closest('button') || target.closest('input')) return;
  isDragging.value = true;
  dragStartTime = Date.now();
  dragOffset.value = {
    x: e.clientX - position.value.x,
    y: window.innerHeight - e.clientY - position.value.y
  };
  const handleMouseMove = (moveEvent: MouseEvent) => {
    if (isDragging.value)
      position.value = {
        x: moveEvent.clientX - dragOffset.value.x,
        y: window.innerHeight - moveEvent.clientY - dragOffset.value.y
      };
  };
  const handleMouseUp = () => {
    setTimeout(() => {
      isDragging.value = false;
    }, 50);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};

const handleBallClick = () => {
  const duration = Date.now() - dragStartTime;
  if (duration < 200) {
    if (emojiQueue.value.length > 0) {
      const id = emojiQueue.value.shift();
      if (id) {
        triggerBubble(id);
      }
    } else if (showEmojiPicker.value) {
      showEmojiPicker.value = false;
    } else {
      toggleMinimize();
    }
  }
};

const toggleEmojiPicker = () => {
  showEmojiPicker.value = !showEmojiPicker.value;
  if (showEmojiPicker.value) isSetting.value = false;
};
const toggleSettings = () => {
  isSetting.value = !isSetting.value;
  if (isSetting.value) showEmojiPicker.value = false;
};
onMounted(() => {
  serverUrlInput.value = window.localStorage.getItem('SYNC_SERVER_URL') || '';
});
const toggleMinimize = () => {
  isMinimized.value = !isMinimized.value;
  isSetting.value = false;
  showEmojiPicker.value = false;
};
const saveServerUrl = () => {
  window.localStorage.setItem('SYNC_SERVER_URL', serverUrlInput.value);
  isSetting.value = false;
  window.location.reload();
};
const handleJoin = (type: 'private' | 'public') => {
  if (!roomInput.value) roomInput.value = Math.random().toString(36).substring(7).toUpperCase();
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
@keyframes bubble-float {
  0% {
    transform: translateY(0) scale(0.3) rotate(0);
    opacity: 0;
  }
  15% {
    opacity: 1;
    transform: translateY(-30px) scale(1.1) rotate(15deg);
  }
  100% {
    transform: translateY(-350px) translateX(var(--drift)) scale(0.8) rotate(-30deg);
    opacity: 0;
  }
}
.bubble-animation {
  animation: bubble-float 3.5s cubic-bezier(0.2, 0.8, 0.4, 1) forwards;
}
@keyframes picker-pop-right {
  from {
    opacity: 0;
    transform: translateY(-50%) scale(0.7) translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(-50%) scale(1) translateX(0);
  }
}
.animate-ball-pop-right {
  animation: picker-pop-right 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
@keyframes queue-hover {
  0%,
  100% {
    transform: translate(-50%, -50%) translateY(0);
  }
  50% {
    transform: translate(-50%, -50%) translateY(-5px);
  }
}
.animate-queue-hover {
  animation: queue-hover 2s infinite ease-in-out;
}
@keyframes headphone-vibrate {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
}
@keyframes pingu-sway {
  0%,
  100% {
    transform: rotate(-3deg) translateY(2px);
  }
  50% {
    transform: rotate(3deg) translateY(-2px);
  }
}
.animate-headphone-vibrate {
  animation: headphone-vibrate 0.4s infinite ease-in-out;
  transform-origin: center;
}
.animate-pingu-sway {
  animation: pingu-sway 0.8s infinite ease-in-out;
}
.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
.custom-scrollbar::-webkit-scrollbar {
  width: 0px;
}
.custom-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
</style>

<template>
  <div
    ref="panelRef"
    id="sync-room-anchor"
    class="sync-room-control fixed z-[999999] select-none bg-transparent"
    :style="panelStyle"
    :class="{
      'rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/20 overflow-hidden':
        !isMinimized,
      'dragging-active': isDragging,
      'panel-transition': !isDragging
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

    <!-- 1. 背景层 (毛玻璃) -->
    <div
      v-if="!isMinimized"
      class="absolute inset-0 z-0 rounded-2xl pointer-events-none"
      :class="
        theme === 'dark' ? 'bg-[#1a1a2e]/90 backdrop-blur-2xl' : 'bg-white/85 backdrop-blur-2xl'
      "
    ></div>

    <!-- 2. 表情气泡堆叠层 -->
    <div class="absolute inset-0 overflow-visible z-[100] pointer-events-none">
      <div
        v-for="(bubble, idx) in activeBubbles"
        :key="bubble.id"
        class="absolute pointer-events-auto cursor-pointer"
        :class="bubble.popping ? 'bubble-pop-out' : 'bubble-pop-in bubble-float-idle'"
        :style="getBubbleStyle(idx)"
        @mousedown.stop="destroyBubble(bubble.id)"
      >
        <div
          class="rounded-full flex items-center justify-center p-[3px]"
          :style="{
            width: '100%',
            height: '100%',
            background: bubble.ringGradient
          }"
        >
          <div
            class="w-full h-full rounded-full bg-white/90 dark:bg-gray-900/80 backdrop-blur-md flex items-center justify-center overflow-hidden shadow-lg"
          >
            <img
              :src="getEmojiUrl(bubble.emojiId)"
              class="w-[75%] h-[75%] object-cover rounded-full"
            />
          </div>
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
      <!-- [重点] 表情包旋转轨道容器 -->
      <div class="absolute inset-0 pointer-events-none overflow-visible z-30 w-full h-full">
        <div
          v-for="(item, index) in emojiQueue"
          :key="item.uid"
          class="absolute w-9 h-9 rounded-full border-2 border-blue-400/60 bg-white/20 backdrop-blur-md shadow-lg overflow-hidden pointer-events-auto cursor-pointer hover:scale-125 transition-none"
          :style="getQueueStyle(index, emojiQueue.length)"
          @click.stop="removeQueuedEmoji(index)"
        >
          <img :src="getEmojiUrl(item.emojiId)" class="w-full h-full object-contain" />
        </div>
      </div>

      <!-- 表情选择器 (右侧弹出) -->
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
          @mouseenter="isHoverCenter = true"
          @mouseleave="isHoverCenter = false"
          class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-white/10 border-2 border-white/30 shadow-inner flex items-center justify-center cursor-pointer group/center transition-all duration-300 hover:scale-110 active:scale-95 z-20 overflow-hidden"
        >
          <img
            :src="getEmojiUrl(selectedEmojiId)"
            class="w-14 h-14 object-cover rounded-full drop-shadow-lg"
          />
        </div>

        <!-- 跑马灯内圈 -->
        <div
          v-for="i in 10"
          :key="'bulb-' + i"
          class="absolute pointer-events-none z-10"
          :style="getOrbitStyle(i - 1, 50, bulbRotation, 10, 12)"
        >
          <div
            class="w-full h-full rounded-full blur-[1px] animate-pulse shadow-lg"
            :style="{
              backgroundColor: bulbColors[(i - 1) % bulbColors.length],
              boxShadow: `0 0 10px ${bulbColors[(i - 1) % bulbColors.length]}`
            }"
          ></div>
        </div>

        <!-- 12个可选表情 -->
        <div
          v-for="id in 12"
          :key="id"
          @mouseenter="handleEmojiHover(id)"
          @mouseleave="handleEmojiLeave"
          class="absolute z-10 cursor-pointer"
          :style="getOrbitStyle(id - 1, 72, wheelRotation, 12, 36)"
          @click.stop="sendEmoji(id)"
        >
          <div
            class="w-full h-full rounded-full bg-white/20 border border-white/40 shadow-sm backdrop-blur-md flex items-center justify-center overflow-hidden transition-transform duration-150"
            :class="{
              'opacity-30 grayscale-[0.3] scale-90': id !== selectedEmojiId,
              'shadow-[0_0_15px_rgba(192,132,252,0.6)] scale-110':
                marqueeIndex === id - 1 || id === selectedEmojiId
            }"
          >
            <img :src="getEmojiUrl(id)" class="w-7 h-7 object-cover rounded-full" />
          </div>
        </div>
      </div>

      <!-- Pingu 头像本体 -->
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
          class="absolute -left-[15%] top-[-25%] w-[130%] h-[130%] pointer-events-none z-30 transition-all duration-500"
          :class="[isPlay ? 'animate-headphone-vibrate' : '-translate-x-[1.5px]']"
        >
          <path
            d="M22 50 A 28 28 0 0 1 78 50"
            fill="none"
            stroke="url(#headphone-gradient)"
            stroke-width="7"
            stroke-linecap="round"
            class="drop-shadow-[0_0_8px_rgba(192,132,252,0.6)]"
          />
          <rect
            x="12"
            y="45"
            width="12"
            height="24"
            rx="6"
            fill="url(#headphone-gradient)"
            class="drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]"
          />
          <rect
            x="76"
            y="45"
            width="12"
            height="24"
            rx="6"
            fill="url(#headphone-gradient)"
            class="drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]"
          />
        </svg>
      </div>

      <!-- 浮动音符 -->
      <div class="absolute inset-0 overflow-visible pointer-events-none z-40">
        <svg
          viewBox="0 0 24 24"
          :class="[
            'absolute w-5 h-5 fill-current mix-blend-screen',
            isPlay ? 'animate-note-float-left' : 'opacity-0'
          ]"
          style="left: 10%; top: 40%; color: #c084fc"
        >
          <path
            d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"
          />
        </svg>
        <svg
          viewBox="0 0 24 24"
          :class="[
            'absolute w-5 h-5 fill-current mix-blend-screen',
            isPlay ? 'animate-note-float-right' : 'opacity-0'
          ]"
          style="right: 10%; top: 40%; color: #6366f1"
        >
          <path
            d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"
          />
        </svg>
        <svg
          viewBox="0 0 24 24"
          :class="[
            'absolute w-4 h-4 fill-current mix-blend-screen',
            isPlay ? 'animate-note-float-top' : 'opacity-0'
          ]"
          style="left: 48%; top: 15%; color: #ec4899"
        >
          <path
            d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"
          />
        </svg>
      </div>
    </div>

    <!-- 4. 完整面板模式 (展开) -->
    <div
      v-else
      class="relative z-10 h-full flex flex-col p-3 animate-fade-in"
      :class="theme === 'dark' ? 'text-white' : 'text-gray-800'"
    >
      <!-- 顶部状态栏 -->
      <div
        class="flex items-center justify-between pb-2 mb-3"
        :class="theme === 'dark' ? 'border-b border-white/5' : 'border-b border-gray-100'"
      >
        <div
          @mousedown="handleMouseDown"
          class="flex items-center space-x-1.5 cursor-move flex-1 h-full"
        >
          <div
            :class="[
              'w-2 h-2 rounded-full',
              isSyncing ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-gray-300 dark:bg-gray-600'
            ]"
          ></div>
          <span class="text-[10px] font-semibold tracking-wide opacity-60 uppercase">{{
            isSyncing ? t('sync.linked') : t('sync.sync')
          }}</span>
        </div>
        <div class="flex items-center space-x-1" @mousedown.stop>
          <button
            @click="toggleSettings"
            class="p-1 rounded-md hover:bg-gray-500/10 transition-all active:scale-95"
            :class="{ 'bg-purple-500/15': isSetting }"
          >
            <svg viewBox="0 0 24 24" class="w-4 h-4">
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
                d="M8,7 L11,8 L12.5,3 L14,10 L16,6 L19,8"
              />
            </svg>
          </button>
          <button
            @click="toggleMinimize"
            class="p-1 rounded-md hover:bg-gray-500/10 transition-all active:scale-95"
          >
            <svg
              viewBox="0 0 24 24"
              class="w-3.5 h-3.5 fill-none stroke-current stroke-2"
              :class="theme === 'dark' ? 'stroke-white/70' : 'stroke-gray-500'"
            >
              <path d="M18 15l-6-6-6 6" />
            </svg>
          </button>
        </div>
      </div>

      <!-- 内容区 -->
      <div
        class="flex-1 overflow-y-auto custom-scrollbar relative z-10 flex flex-col items-center justify-center w-full"
      >
        <!-- 服务器设置 -->
        <div
          v-if="isSetting"
          class="w-full flex flex-col items-center justify-center space-y-3 px-2"
        >
          <div class="text-[10px] font-semibold tracking-widest opacity-50 uppercase">
            {{ t('sync.endpoint') }}
          </div>
          <input
            v-model="serverUrlInput"
            type="text"
            @mousedown.stop
            placeholder="https://..."
            class="w-full rounded-lg px-3 py-2 text-[11px] text-center outline-none transition-all"
            :class="
              theme === 'dark'
                ? 'bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-purple-400/50'
                : 'bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-300 focus:border-purple-300'
            "
          />
          <button
            @click="saveServerUrl"
            class="w-full py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all active:scale-[0.97]"
            :class="
              theme === 'dark'
                ? 'bg-purple-500/80 text-white hover:bg-purple-500'
                : 'bg-gray-900 text-white hover:bg-gray-800'
            "
          >
            {{ t('sync.save') }}
          </button>
        </div>

        <!-- 同步主面板 -->
        <div v-else class="w-full flex flex-col items-center justify-center px-2">
          <div v-if="!isSyncing" class="w-full flex flex-col items-center space-y-3">
            <div class="text-[10px] font-semibold tracking-widest opacity-50 uppercase">
              {{ t('sync.code') }}
            </div>
            <input
              v-model="roomInput"
              type="text"
              @mousedown.stop
              maxlength="8"
              placeholder=""
              class="w-full rounded-lg px-2 py-2.5 text-lg text-center font-black tracking-[0.4em] outline-none transition-all"
              :class="
                theme === 'dark'
                  ? 'bg-white/5 border border-white/10 text-white focus:border-purple-400/50'
                  : 'bg-gray-50 border border-gray-200 text-gray-800 focus:border-purple-300'
              "
            />
            <div class="grid grid-cols-2 gap-2 w-full">
              <button
                @click="handleJoin('private')"
                class="py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all active:scale-[0.97]"
                :class="
                  theme === 'dark'
                    ? 'bg-white text-black hover:bg-gray-100'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                "
              >
                {{ t('sync.privateRoom') }}
              </button>
              <button
                @click="handleJoin('public')"
                class="py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all active:scale-[0.97]"
                :class="
                  theme === 'dark'
                    ? 'bg-white/10 text-white hover:bg-white/15'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                "
              >
                {{ t('sync.publicRoom') }}
              </button>
            </div>
          </div>
          <div v-else class="w-full flex flex-col items-center space-y-3 py-6">
            <div class="text-[9px] font-semibold tracking-[0.3em] opacity-40 uppercase">
              {{ t('sync.quantumRoom') }}
            </div>
            <div
              class="text-2xl font-mono font-black tracking-[0.15em]"
              :class="theme === 'dark' ? 'text-white' : 'text-gray-900'"
            >
              {{ roomId }}
            </div>
            <button
              @click="leaveRoom"
              class="text-[10px] font-semibold opacity-50 hover:opacity-100 transition-opacity mt-1"
              :class="theme === 'dark' ? 'text-red-400' : 'text-red-500'"
            >
              {{ t('sync.disconnect') }}
            </button>
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
const isHoverCenter = ref(false);
const isHoverWheel = ref(false);
const marqueeIndex = ref(0);
const wheelRotation = ref(0);
const bulbRotation = ref(0);
const emojiQueue = ref<{ uid: number; emojiId: number }[]>([]);
const queueRotation = ref(0);

const bulbColors = [
  '#FFD700',
  '#FF69B4',
  '#00FF7F',
  '#00BFFF',
  '#FF4500',
  '#FF00FF',
  '#7FFF00',
  '#1E90FF',
  '#FF1493',
  '#FFFF00'
];

let randomTimer: any = null;
let marqueeTimer: any = null;
let queueTimer: any = null;

const startQueueRotation = () => {
  if (queueTimer) return;
  const animate = () => {
    queueRotation.value += 0.5;
    queueTimer = requestAnimationFrame(animate);
  };
  queueTimer = requestAnimationFrame(animate);
};

const stopQueueRotation = () => {
  if (queueTimer) cancelAnimationFrame(queueTimer);
  queueTimer = null;
};

watch(
  isMinimized,
  (val) => {
    if (val) {
      startQueueRotation();
    } else {
      stopQueueRotation();
    }
  },
  { immediate: true }
);

let pickerAnimationFrame: number | null = null;

const startEmojiPickerEffects = () => {
  if (marqueeTimer) clearInterval(marqueeTimer);
  marqueeTimer = setInterval(() => {
    marqueeIndex.value = (marqueeIndex.value + 1) % 12;
  }, 100);

  const animate = () => {
    wheelRotation.value -= 0.25;
    if (wheelRotation.value <= -360) wheelRotation.value += 360;

    bulbRotation.value -= 0.7;
    if (bulbRotation.value <= -360) bulbRotation.value += 360;

    pickerAnimationFrame = requestAnimationFrame(animate);
  };
  if (!pickerAnimationFrame) animate();

  if (randomTimer) clearInterval(randomTimer);
  randomTimer = setInterval(() => {
    if (!isHoverCenter.value && !isHoverWheel.value) {
      selectedEmojiId.value = Math.floor(Math.random() * 12) + 1;
    }
  }, 800);
};

const stopEmojiPickerEffects = () => {
  if (marqueeTimer) clearInterval(marqueeTimer);
  if (pickerAnimationFrame) cancelAnimationFrame(pickerAnimationFrame);
  if (randomTimer) clearInterval(randomTimer);
  marqueeTimer = null;
  pickerAnimationFrame = null;
  randomTimer = null;
};

watch(showEmojiPicker, (val) => {
  val ? startEmojiPickerEffects() : stopEmojiPickerEffects();
});

const position = ref({ x: 16, y: 96 });
const isDragging = ref(false);
let dragStartTime = 0;

const panelStyle = computed(() => ({
  left: `${position.value.x}px`,
  bottom: `${position.value.y}px`,
  width: isMinimized.value ? '96px' : '220px',
  height: isMinimized.value ? '96px' : '260px',
  minWidth: isMinimized.value ? '96px' : '220px',
  visibility: 'visible' as const,
  opacity: '1'
}));

const getOrbitStyle = (
  index: number,
  radius: number,
  offset: number,
  total: number,
  itemSize: number = 36
) => {
  const angleDeg = (index * 360) / total + offset;
  const angleRad = (angleDeg * Math.PI) / 180;
  // 选择器容器是 w-48 h-48 = 192x192px，中心在 (96, 96)
  const cx = 96;
  const cy = 96;
  const x = cx + Math.sin(angleRad) * radius;
  const y = cy - Math.cos(angleRad) * radius;
  const half = itemSize / 2;
  return {
    position: 'absolute' as const,
    left: `${x}px`,
    top: `${y}px`,
    width: `${itemSize}px`,
    height: `${itemSize}px`,
    marginLeft: `-${half}px`,
    marginTop: `-${half}px`,
    transition: 'none'
  };
};

const getQueueStyle = (index: number, total: number) => {
  const radius = 95;
  const effectiveTotal = Math.max(total, 1);
  const angleStep = (2 * Math.PI) / effectiveTotal;

  // Rotation in Radians
  const rotationRad = (queueRotation.value * Math.PI) / 180;

  // Final angle: start from -PI/2 (top) + index step + rotation
  const angle = -Math.PI / 2 + index * angleStep - rotationRad;

  // Center of the 96x96 container
  const cx = 48;
  const cy = 48;

  const x = cx + Math.cos(angle) * radius;
  const y = cy + Math.sin(angle) * radius;

  return {
    position: 'absolute' as const,
    left: `${x}px`,
    top: `${y}px`,
    width: '36px',
    height: '36px',
    marginLeft: '-18px', // Center the bubble (half width)
    marginTop: '-18px', // Center the bubble (half height)
    zIndex: 100 + index,
    transition: 'none' // Important: disable transition for smooth requestAnimationFrame
  };
};

const handleEmojiHover = (id: number) => {
  isHoverWheel.value = true;
  selectedEmojiId.value = id;
};
const handleEmojiLeave = () => {
  isHoverWheel.value = false;
};
const getEmojiUrl = (id: number) =>
  new URL(`../assets/sync/emojis/emoji-${id}.png`, import.meta.url).href;

const sendEmoji = (id: number) => {
  syncStore.sendSync('send_emoji', { emojiId: id });
  playSendSound();
};

watch(receivedEmoji, (newVal) => {
  if (newVal) {
    emojiQueue.value.push({ uid: Date.now() + Math.random(), emojiId: newVal.id });
    if (emojiQueue.value.length > 10) emojiQueue.value.shift();
    triggerBubble(newVal.id);
    playReceiveSound();
  }
});

const bubbleGradients = [
  'linear-gradient(135deg, rgba(244,114,182,0.7), rgba(251,191,36,0.4))',
  'linear-gradient(135deg, rgba(96,165,250,0.7), rgba(52,211,153,0.4))',
  'linear-gradient(135deg, rgba(167,139,250,0.7), rgba(244,114,182,0.4))',
  'linear-gradient(135deg, rgba(251,146,60,0.7), rgba(250,204,21,0.4))',
  'linear-gradient(135deg, rgba(52,211,153,0.7), rgba(56,189,248,0.4))',
  'linear-gradient(135deg, rgba(248,113,113,0.7), rgba(167,139,250,0.4))',
  'linear-gradient(135deg, rgba(56,189,248,0.7), rgba(192,132,252,0.4))',
  'linear-gradient(135deg, rgba(250,204,21,0.7), rgba(251,146,60,0.4))'
];
let bubbleColorIdx = 0;

const triggerBubble = (emojiId: number) => {
  const id = Date.now() + Math.random();
  // 随机散开位置（相对于 Pingu 中心上方区域）
  const x = 10 + Math.random() * 60; // 10~70px from left
  const y = 50 + Math.random() * 80; // 50~130px from bottom (above Pingu)
  const ringGradient = bubbleGradients[bubbleColorIdx % bubbleGradients.length];
  bubbleColorIdx++;
  activeBubbles.value.push({ id, emojiId, x, y, ringGradient });
};

const getBubbleStyle = (idx: number) => {
  const total = activeBubbles.value.length;
  const age = total - 1 - idx; // 0 = newest
  // 最新的最大 (52px), 越旧越小, 最小 24px
  const size = Math.max(24, 52 - age * 4);
  const bubble = activeBubbles.value[idx];
  return {
    left: bubble.x + 'px',
    bottom: bubble.y + 'px',
    width: size + 'px',
    height: size + 'px',
    zIndex: 100 + total - age,
    transition: 'width 0.3s, height 0.3s',
    '--float-x': ((idx % 3) - 1) * 3 + 'px',
    '--float-y': 4 + (idx % 2) * 2 + 'px',
    animationDelay: ((idx * 0.3) % 2) + 's',
    animationDuration: 2.5 + (idx % 3) * 0.5 + 's'
  };
};

const destroyBubble = (id: number) => {
  const bubble = activeBubbles.value.find((b) => b.id === id);
  if (bubble && !bubble.popping) {
    bubble.popping = true;
    playPopSound();
    setTimeout(() => {
      const idx = activeBubbles.value.findIndex((b) => b.id === id);
      if (idx !== -1) activeBubbles.value.splice(idx, 1);
    }, 300);
  }
};

const removeQueuedEmoji = (index: number) => {
  emojiQueue.value.splice(index, 1);
};

const handleMouseDown = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (target.closest('button') || target.closest('input')) return;
  e.preventDefault();
  isDragging.value = true;
  dragStartTime = Date.now();
  const startX = e.clientX,
    startY = e.clientY,
    initialX = position.value.x,
    initialY = position.value.y;
  const handleMouseMove = (moveEvent: MouseEvent) => {
    if (!isDragging.value) return;
    const deltaX = moveEvent.clientX - startX,
      deltaY = moveEvent.clientY - startY;
    position.value = { x: Math.max(0, initialX + deltaX), y: Math.max(0, initialY - deltaY) };
  };
  const handleMouseUp = () => {
    isDragging.value = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};

const handleBallClick = () => {
  if (Date.now() - dragStartTime < 200) {
    if (emojiQueue.value.length > 0) {
      const item = emojiQueue.value.shift();
      if (item) triggerBubble(item.emojiId);
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

// === 音效系统 (Web Audio API) ===
let audioCtx: AudioContext | null = null;
const getAudioCtx = () => {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
};

// 发送表情：柔和上行连音 ✨
const playSendSound = () => {
  try {
    const ctx = getAudioCtx();
    const t = ctx.currentTime;
    [880, 1100, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.08);
      gain.gain.setValueAtTime(0, t + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.06, t + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.2);
    });
  } catch {
    /* empty */
  }
};

// 收到表情：轻柔水滴声 💧
const playReceiveSound = () => {
  try {
    const ctx = getAudioCtx();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(1000, t + 0.1);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.3);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.08, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.3);
  } catch {
    /* empty */
  }
};

// 点击消失：随机柔和音符 🎵
const pentatonicNotes = [523, 587, 659, 784, 880, 1047, 1175, 1319];
const playPopSound = () => {
  try {
    const ctx = getAudioCtx();
    const t = ctx.currentTime;
    const freq = pentatonicNotes[Math.floor(Math.random() * pentatonicNotes.length)];
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.07, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.3);
  } catch {
    /* empty */
  }
};
</script>

<style scoped>
.sync-room-control {
  box-sizing: border-box;
}
.panel-transition {
  transition:
    width 700ms ease-in-out,
    height 700ms ease-in-out,
    border-radius 700ms ease-in-out,
    box-shadow 700ms ease-in-out;
}
.dragging-active {
  transition: none !important;
}
@keyframes bubble-pop-in {
  0% {
    transform: scale(0) rotate(-15deg);
    opacity: 0;
  }
  60% {
    transform: scale(1.15) rotate(5deg);
    opacity: 1;
  }
  100% {
    transform: scale(1) rotate(0);
    opacity: 1;
  }
}
.bubble-pop-in {
  animation: bubble-pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
@keyframes bubble-pop-out {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  30% {
    transform: scale(1.2);
    opacity: 0.8;
  }
  100% {
    transform: scale(0) rotate(30deg);
    opacity: 0;
  }
}
.bubble-pop-out {
  animation: bubble-pop-out 0.3s ease-in forwards;
  pointer-events: none;
}
@keyframes bubble-float-idle {
  0%,
  100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(var(--float-x, 2px), calc(-1 * var(--float-y, 4px)));
  }
}
.bubble-float-idle {
  animation:
    bubble-pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
    bubble-float-idle 3s ease-in-out infinite 0.4s;
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
.animate-pingu-sway {
  animation: pingu-sway 0.8s infinite ease-in-out;
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
@keyframes note-float-left {
  0% {
    transform: translate(0, 0) scale(0.5);
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  100% {
    transform: translate(-40px, -60px) rotate(-45deg) scale(1.2);
    opacity: 0;
  }
}
.animate-note-float-left {
  animation: note-float-left 3s infinite ease-out;
}
@keyframes note-float-right {
  0% {
    transform: translate(0, 0) scale(0.5);
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  100% {
    transform: translate(40px, -60px) rotate(45deg) scale(1.2);
    opacity: 0;
  }
}
.animate-note-float-right {
  animation: note-float-right 3.2s infinite ease-out 0.5s;
}
@keyframes note-float-top {
  0% {
    transform: translate(0, 0) scale(0.5);
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  100% {
    transform: translate(0, -80px) rotate(10deg) scale(1.2);
    opacity: 0;
  }
}
.animate-note-float-top {
  animation: note-float-top 2.8s infinite ease-out 1s;
}
@keyframes headphone-vibrate {
  0%,
  100% {
    transform: translateX(-2px) scale(1);
  }
  50% {
    transform: translateX(-2px) scale(1.08);
  }
}
.animate-headphone-vibrate {
  animation: headphone-vibrate 0.4s infinite ease-in-out;
  transform-origin: center;
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
.custom-scrollbar {
  scrollbar-width: none;
}
</style>

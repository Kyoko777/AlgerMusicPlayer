<template>
  <div
    class="sync-room-control fixed left-4 bottom-24 w-40 h-40 rounded-2xl overflow-hidden shadow-2xl z-[9999] select-none border border-white/10 group animate-slide-in"
  >
    <!-- 背景层 -->
    <div class="absolute inset-0 z-0">
      <img
        src="@/assets/sync/bg.jpg"
        class="w-full h-full object-cover grayscale-[0.1] opacity-60 transition-transform duration-700 group-hover:scale-110"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
    </div>

    <!-- 内容层 -->
    <div class="relative z-10 h-full flex flex-col justify-between p-3 text-white">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <div
            :class="[
              'w-2 h-2 rounded-full shadow-lg',
              isSyncing ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            ]"
          ></div>
          <span class="text-[10px] font-black tracking-widest uppercase">{{
            isSyncing ? 'Online' : 'Sync'
          }}</span>
        </div>
        <button
          v-if="isSyncing"
          @click="leaveRoom"
          class="text-[10px] text-red-400 font-black hover:text-red-300 transition-colors uppercase"
        >
          Leave
        </button>
      </div>

      <div v-if="!isSyncing" class="space-y-2">
        <input
          v-model="roomInput"
          type="text"
          maxlength="8"
          :placeholder="$t('sync.inputPlaceholder')"
          class="w-full bg-black/40 border border-white/20 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-white/50 text-white placeholder:text-gray-500 backdrop-blur-sm"
        />
        <div class="flex flex-col gap-1.5">
          <button
            @click="handleJoin('private')"
            class="w-full py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-[10px] font-black uppercase transition-all active:scale-95 shadow-lg"
          >
            {{ $t('sync.privateRoom') }}
          </button>
          <button
            @click="handleJoin('public')"
            class="w-full py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-[10px] font-black uppercase transition-all active:scale-95 shadow-lg"
          >
            {{ $t('sync.publicRoom') }}
          </button>
        </div>
      </div>

      <div
        v-else
        class="flex flex-col items-center justify-center bg-black/40 rounded-xl py-3 border border-white/10 backdrop-blur-md"
      >
        <div class="text-[8px] text-gray-400 uppercase tracking-[0.4em] mb-1">Room ID</div>
        <div class="text-sm font-mono font-black tracking-widest">{{ roomId }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ref } from 'vue';

import { useSyncStore } from '@/store/modules/sync';

const syncStore = useSyncStore();
const { isSyncing, roomId } = storeToRefs(syncStore);
const roomInput = ref('');

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
.animate-slide-in {
  animation: slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>

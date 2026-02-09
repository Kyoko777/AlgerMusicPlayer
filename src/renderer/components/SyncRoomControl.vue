<template>
  <div class="sync-room-control fixed left-4 bottom-24 w-44 h-44 rounded-2xl overflow-hidden shadow-2xl z-[9999] select-none border border-white/10 group animate-slide-in backdrop-blur-sm">
    <!-- 背景层 -->
    <div class="absolute inset-0 z-0">
      <img src="@/assets/sync/bg.jpg" class="w-full h-full object-cover grayscale-[0.1] opacity-60 transition-transform duration-700 group-hover:scale-110" />
      <div class="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
    </div>

    <!-- 内容层 -->
    <div class="relative z-10 h-full flex flex-col justify-between p-3 text-white">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <div :class="['w-2 h-2 rounded-full shadow-lg', isSyncing ? 'bg-green-500 animate-pulse' : 'bg-gray-400']"></div>
          <span class="text-[10px] font-black tracking-widest uppercase">{{ isSyncing ? 'Online' : 'Sync' }}</span>
        </div>
        <div class="flex items-center space-x-2">
          <button @click="toggleSettings" class="text-[10px] opacity-60 hover:opacity-100 transition-opacity">
            {{ isSetting ? 'BACK' : '⚙️' }}
          </button>
          <button v-if="isSyncing && !isSetting" @click="leaveRoom" class="text-[10px] text-red-400 font-black hover:text-red-300 transition-colors uppercase">Leave</button>
        </div>
      </div>

      <!-- 设置模式 -->
      <div v-if="isSetting" class="space-y-2 animate-fade-in">
        <div class="text-[8px] text-gray-400 uppercase tracking-widest font-bold">Server URL</div>
        <input 
          v-model="serverUrlInput" 
          type="text" 
          placeholder="https://xxx.loca.lt"
          class="w-full bg-black/60 border border-white/20 rounded-lg px-2 py-1.5 text-[9px] focus:outline-none focus:border-white/50 text-white"
        />
        <button @click="saveServerUrl" class="w-full py-1.5 bg-green-600/40 hover:bg-green-600/60 border border-white/10 rounded-lg text-[9px] font-black uppercase transition-all active:scale-95">
          Save & Reload
        </button>
      </div>

      <!-- 主模式：未连接 -->
      <div v-else-if="!isSyncing" class="space-y-2">
        <input 
          v-model="roomInput" 
          type="text" 
          maxlength="8"
          :placeholder="$t('sync.inputPlaceholder')"
          class="w-full bg-black/40 border border-white/20 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-white/50 text-white placeholder:text-gray-500"
        />
        <div class="flex flex-col gap-1.5">
          <button @click="handleJoin('private')" class="w-full py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-[10px] font-black uppercase transition-all active:scale-95 shadow-lg">
            {{ $t('sync.privateRoom') }}
          </button>
          <button @click="handleJoin('public')" class="w-full py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-[10px] font-black uppercase transition-all active:scale-95 shadow-lg">
            {{ $t('sync.publicRoom') }}
          </button>
        </div>
      </div>

      <!-- 主模式：已连接 -->
      <div v-else class="flex flex-col items-center justify-center bg-black/40 rounded-xl py-3 border border-white/10 backdrop-blur-md">
        <div class="text-[8px] text-gray-400 uppercase tracking-[0.4em] mb-1">Room ID</div>
        <div class="text-sm font-mono font-black tracking-widest">{{ roomId }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useSyncStore } from '@/store/modules/sync';

const syncStore = useSyncStore();
const { isSyncing, roomId } = storeToRefs(syncStore);
const roomInput = ref('');
const isSetting = ref(false);
const serverUrlInput = ref('');

onMounted(() => {
  serverUrlInput.value = window.localStorage.getItem('SYNC_SERVER_URL') || '';
});

const toggleSettings = () => {
  isSetting.value = !isSetting.value;
};

const saveServerUrl = () => {
  window.localStorage.setItem('SYNC_SERVER_URL', serverUrlInput.value);
  isSetting.value = false;
  // 提示刷新
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
.animate-slide-in {
  animation: slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>

import { defineStore } from 'pinia';
import { io, Socket } from 'socket.io-client';
import { ref, watch } from 'vue';

import { usePlayerStore } from './player';

export const useSyncStore = defineStore('sync', () => {
  const playerStore = usePlayerStore();
  const socket = ref<Socket | null>(null);

  const isSyncing = ref(false);
  const roomId = ref('');
  const roomType = ref<'private' | 'public'>('private'); // private = 双人, public = 多人
  const userId = ref(Math.random().toString(36).substring(7));
  const isHost = ref(false);

  // 初始化连接
  const initSync = (targetRoomId: string, type: 'private' | 'public' = 'private') => {
    // 这里的 URL 之后可以替换为真实的服务器地址
    socket.value = io('http://192.168.124.3:3000', {
      query: { roomId: targetRoomId, userId: userId.value }
    });

    roomId.value = targetRoomId;
    roomType.value = type;

    socket.value.on('connect', () => {
      console.log('[Sync] Connected to relay server');
      isSyncing.value = true;
    });

    // 监听来自他人的同步指令
    socket.value.on('apply_sync', async (data: any) => {
      console.log('[Sync] Receiving remote operation:', data.operation);

      // 这里的逻辑需要小心处理，避免循环触发
      if (data.operation === 'play_music') {
        // 传入 isRemote = true，防止二次广播导致死循环
        await playerStore.handlePlayMusic(data.music, true, true);
      } else if (data.operation === 'pause') {
        playerStore.handlePause();
      } else if (data.operation === 'resume') {
        playerStore.setIsPlay(true);
      }
    });

    socket.value.on('disconnect', () => {
      isSyncing.value = false;
    });
  };

  // 发送同步指令
  const sendSync = (operation: string, data: any) => {
    if (isSyncing.value && socket.value) {
      console.log('[Sync] Sending operation:', operation);
      socket.value.emit('sync_operation', {
        roomId: roomId.value,
        operation,
        data,
        timestamp: Date.now()
      });
    }
  };

  const leaveRoom = () => {
    if (socket.value) {
      socket.value.disconnect();
      socket.value = null;
    }
    isSyncing.value = false;
    roomId.value = '';
  };

  return {
    isSyncing,
    roomId,
    roomType,
    userId,
    isHost,
    initSync,
    sendSync,
    leaveRoom
  };
});

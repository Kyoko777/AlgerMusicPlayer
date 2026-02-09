import { defineStore } from 'pinia';
import { io, Socket } from 'socket.io-client';
import { ref, watch } from 'vue';

import { audioService } from '@/services/audioService';
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
    // 自动检测环境：如果是本地开发则用本地IP，否则可以手动指定
    const serverUrl = window.localStorage.getItem('SYNC_SERVER_URL') || 'http://192.168.124.3:3000';

    socket.value = io(serverUrl, {
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
      
      const operation = data.operation;
      const remoteData = data.data;

      // 这里的逻辑需要小心处理，避免循环触发
      if (operation === 'play_music') {
        // 传入 isRemote = true，防止二次广播导致死循环
        if (remoteData?.music) {
          await playerStore.handlePlayMusic(remoteData.music, true, true);
          
          // 如果远端带了进度，进行对齐
          if (remoteData?.currentTime) {
            setTimeout(() => {
              audioService.seek(remoteData.currentTime);
            }, 1000); // 稍微延迟确保歌曲已加载
          }
        }
      } else if (operation === 'pause') {
        playerStore.handlePause(true);
      } else if (operation === 'resume') {
        playerStore.setIsPlay(true, true);
        if (remoteData?.currentTime) {
          audioService.seek(remoteData.currentTime);
        }
      }
    });

    socket.value.on('disconnect', () => {
      isSyncing.value = false;
    });
  };

  // 发送同步指令
  const sendSync = (operation: string, data: any) => {
    if (isSyncing.value && socket.value) {
      // 附加当前进度
      const currentSound = audioService.getCurrentSound();
      const currentTime = currentSound?.seek() || 0;

      console.log('[Sync] Sending operation:', operation);
      socket.value.emit('sync_operation', {
        roomId: roomId.value,
        operation,
        data: {
          ...data,
          currentTime
        },
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

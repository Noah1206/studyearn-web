// src/lib/agora/agoraService.ts
// Agora 실시간 스트리밍 서비스 (웹 버전)

import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IRemoteVideoTrack,
  IRemoteAudioTrack,
  UID,
} from 'agora-rtc-sdk-ng';

const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || '';

export interface AgoraConfig {
  channelName: string;
  uid: number;
  token?: string;
}

export interface RemoteUser {
  uid: UID;
  hasVideo: boolean;
  hasAudio: boolean;
  videoTrack?: IRemoteVideoTrack;
  audioTrack?: IRemoteAudioTrack;
}

class WebAgoraService {
  private client: IAgoraRTCClient | null = null;
  private localVideoTrack: ICameraVideoTrack | null = null;
  private localAudioTrack: IMicrophoneAudioTrack | null = null;
  private isInitialized = false;
  private currentChannel: string | null = null;
  private localUid: UID = 0;
  private remoteUsers: Map<UID, RemoteUser> = new Map();

  private onUserJoined?: (uid: UID) => void;
  private onUserLeft?: (uid: UID) => void;
  private onUserVideoStateChanged?: (uid: UID, hasVideo: boolean) => void;
  private onRemoteUserUpdated?: (users: RemoteUser[]) => void;
  private onError?: (error: string) => void;

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      if (!AGORA_APP_ID) {
        console.warn('[Agora Web] App ID가 설정되지 않았습니다. Mock 모드로 동작합니다.');
        this.isInitialized = true;
        return true;
      }

      // RTC 클라이언트 생성
      this.client = AgoraRTC.createClient({
        mode: 'live',
        codec: 'vp8',
      });

      this.registerEventHandlers();
      this.isInitialized = true;
      console.log('[Agora Web] 초기화 성공');
      return true;
    } catch (error) {
      console.error('[Agora Web] 초기화 실패:', error);
      this.onError?.(`초기화 실패: ${error}`);
      return false;
    }
  }

  private registerEventHandlers() {
    if (!this.client) return;

    // 원격 사용자가 오디오/비디오 트랙을 publish할 때
    this.client.on('user-published', async (user, mediaType) => {
      if (!this.client) return;

      await this.client.subscribe(user, mediaType);
      console.log('[Agora Web] 유저 트랙 구독:', user.uid, mediaType);

      const existingUser = this.remoteUsers.get(user.uid) || {
        uid: user.uid,
        hasVideo: false,
        hasAudio: false,
      };

      if (mediaType === 'video') {
        existingUser.hasVideo = true;
        existingUser.videoTrack = user.videoTrack;
        this.onUserVideoStateChanged?.(user.uid, true);
      } else if (mediaType === 'audio') {
        existingUser.hasAudio = true;
        existingUser.audioTrack = user.audioTrack;
        // 오디오 자동 재생
        user.audioTrack?.play();
      }

      this.remoteUsers.set(user.uid, existingUser);
      this.notifyRemoteUsersUpdated();
    });

    // 원격 사용자가 트랙을 unpublish할 때
    this.client.on('user-unpublished', (user, mediaType) => {
      console.log('[Agora Web] 유저 트랙 해제:', user.uid, mediaType);

      const existingUser = this.remoteUsers.get(user.uid);
      if (existingUser) {
        if (mediaType === 'video') {
          existingUser.hasVideo = false;
          existingUser.videoTrack = undefined;
          this.onUserVideoStateChanged?.(user.uid, false);
        } else if (mediaType === 'audio') {
          existingUser.hasAudio = false;
          existingUser.audioTrack = undefined;
        }
        this.remoteUsers.set(user.uid, existingUser);
        this.notifyRemoteUsersUpdated();
      }
    });

    // 원격 사용자 입장
    this.client.on('user-joined', (user) => {
      console.log('[Agora Web] 유저 입장:', user.uid);
      this.remoteUsers.set(user.uid, {
        uid: user.uid,
        hasVideo: false,
        hasAudio: false,
      });
      this.onUserJoined?.(user.uid);
      this.notifyRemoteUsersUpdated();
    });

    // 원격 사용자 퇴장
    this.client.on('user-left', (user) => {
      console.log('[Agora Web] 유저 퇴장:', user.uid);
      this.remoteUsers.delete(user.uid);
      this.onUserLeft?.(user.uid);
      this.notifyRemoteUsersUpdated();
    });

    // 에러 처리
    this.client.on('exception', (event) => {
      console.error('[Agora Web] 예외:', event);
      this.onError?.(event.msg);
    });
  }

  private notifyRemoteUsersUpdated() {
    this.onRemoteUserUpdated?.(Array.from(this.remoteUsers.values()));
  }

  async joinChannelAsBroadcaster(config: AgoraConfig): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.client) {
        console.log('[Agora Web] Mock 모드: 채널 입장 (방송자)');
        this.currentChannel = config.channelName;
        this.localUid = config.uid;
        return true;
      }

      // 호스트 역할 설정
      await this.client.setClientRole('host');

      // 채널 입장
      await this.client.join(
        AGORA_APP_ID,
        config.channelName,
        config.token || null,
        config.uid
      );

      this.currentChannel = config.channelName;
      this.localUid = config.uid;

      console.log('[Agora Web] 채널 입장 (방송자):', config.channelName);
      return true;
    } catch (error) {
      console.error('[Agora Web] 채널 입장 실패:', error);
      this.onError?.(`채널 입장 실패: ${error}`);
      return false;
    }
  }

  async joinChannelAsAudience(config: AgoraConfig): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.client) {
        console.log('[Agora Web] Mock 모드: 채널 입장 (시청자)');
        this.currentChannel = config.channelName;
        this.localUid = config.uid;
        return true;
      }

      // 시청자 역할 설정
      await this.client.setClientRole('audience');

      // 채널 입장
      await this.client.join(
        AGORA_APP_ID,
        config.channelName,
        config.token || null,
        config.uid
      );

      this.currentChannel = config.channelName;
      this.localUid = config.uid;

      console.log('[Agora Web] 채널 입장 (시청자):', config.channelName);
      return true;
    } catch (error) {
      console.error('[Agora Web] 채널 입장 실패:', error);
      this.onError?.(`채널 입장 실패: ${error}`);
      return false;
    }
  }

  async leaveChannel(): Promise<void> {
    try {
      await this.stopCamera();
      await this.stopMicrophone();

      if (this.client && this.currentChannel) {
        await this.client.leave();
        this.currentChannel = null;
        this.remoteUsers.clear();
        console.log('[Agora Web] 채널 퇴장');
      }
    } catch (error) {
      console.error('[Agora Web] 채널 퇴장 실패:', error);
    }
  }

  async setCameraEnabled(enabled: boolean): Promise<void> {
    try {
      if (enabled) {
        await this.startCamera();
      } else {
        await this.stopCamera();
      }
      console.log('[Agora Web] 카메라:', enabled ? 'ON' : 'OFF');
    } catch (error) {
      console.error('[Agora Web] 카메라 설정 실패:', error);
      throw error;
    }
  }

  private async startCamera(): Promise<void> {
    if (!this.client) return;

    // 이미 트랙이 있으면 재사용
    if (this.localVideoTrack) {
      await this.client.publish(this.localVideoTrack);
      return;
    }

    // 새 트랙 생성
    this.localVideoTrack = await AgoraRTC.createCameraVideoTrack({
      encoderConfig: {
        width: 480,
        height: 640,
        frameRate: 15,
        bitrateMin: 200,
        bitrateMax: 600,
      },
    });

    await this.client.publish(this.localVideoTrack);
  }

  private async stopCamera(): Promise<void> {
    if (this.localVideoTrack) {
      if (this.client) {
        await this.client.unpublish(this.localVideoTrack);
      }
      this.localVideoTrack.stop();
      this.localVideoTrack.close();
      this.localVideoTrack = null;
    }
  }

  async setMicrophoneEnabled(enabled: boolean): Promise<void> {
    try {
      if (enabled) {
        await this.startMicrophone();
      } else {
        await this.stopMicrophone();
      }
      console.log('[Agora Web] 마이크:', enabled ? 'ON' : 'OFF');
    } catch (error) {
      console.error('[Agora Web] 마이크 설정 실패:', error);
      throw error;
    }
  }

  private async startMicrophone(): Promise<void> {
    if (!this.client) return;

    if (this.localAudioTrack) {
      await this.client.publish(this.localAudioTrack);
      return;
    }

    this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    await this.client.publish(this.localAudioTrack);
  }

  private async stopMicrophone(): Promise<void> {
    if (this.localAudioTrack) {
      if (this.client) {
        await this.client.unpublish(this.localAudioTrack);
      }
      this.localAudioTrack.stop();
      this.localAudioTrack.close();
      this.localAudioTrack = null;
    }
  }

  setCallbacks(callbacks: {
    onUserJoined?: (uid: UID) => void;
    onUserLeft?: (uid: UID) => void;
    onUserVideoStateChanged?: (uid: UID, hasVideo: boolean) => void;
    onRemoteUserUpdated?: (users: RemoteUser[]) => void;
    onError?: (error: string) => void;
  }) {
    this.onUserJoined = callbacks.onUserJoined;
    this.onUserLeft = callbacks.onUserLeft;
    this.onUserVideoStateChanged = callbacks.onUserVideoStateChanged;
    this.onRemoteUserUpdated = callbacks.onRemoteUserUpdated;
    this.onError = callbacks.onError;
  }

  getLocalVideoTrack(): ICameraVideoTrack | null {
    return this.localVideoTrack;
  }

  getRemoteUsers(): RemoteUser[] {
    return Array.from(this.remoteUsers.values());
  }

  getRemoteUser(uid: UID): RemoteUser | undefined {
    return this.remoteUsers.get(uid);
  }

  getLocalUid(): UID {
    return this.localUid;
  }

  async destroy(): Promise<void> {
    try {
      await this.leaveChannel();
      if (this.client) {
        this.client.removeAllListeners();
      }
      this.client = null;
      this.isInitialized = false;
      console.log('[Agora Web] 정리 완료');
    } catch (error) {
      console.error('[Agora Web] 정리 실패:', error);
    }
  }
}

// 싱글톤 인스턴스
export const agoraService = new WebAgoraService();
export default agoraService;

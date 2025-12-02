/**
 * NotificationSound Service
 * Plays sound notifications for incoming messages when user is not actively viewing the chat
 *
 * Features:
 * - Plays sound when tab is not visible
 * - Plays sound on mobile when chat is not open
 * - Respects user preferences and browser autoplay policies
 * - Singleton pattern to avoid multiple audio instances
 */

class NotificationSoundService {
  private audio: HTMLAudioElement | null = null;
  private isInitialized = false;
  private isMuted = false;

  /**
   * Initialize the audio element
   * Must be called after user interaction due to browser autoplay policies
   */
  initialize() {
    if (this.isInitialized || typeof window === 'undefined') {
      return;
    }

    try {
      this.audio = new Audio('/notification-sound.mp3');
      this.audio.volume = 0.5; // Set to 50% volume by default
      this.audio.preload = 'auto';
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize notification sound:', error);
    }
  }

  /**
   * Check if the user is currently viewing the tab
   */
  private isTabVisible(): boolean {
    if (typeof document === 'undefined') return true;
    return document.visibilityState === 'visible';
  }

  /**
   * Check if user is on mobile device
   */
  private isMobileDevice(): boolean {
    if (typeof navigator === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  /**
   * Play notification sound if conditions are met
   * @param isChatOpen - Whether the chat section is currently open (for mobile)
   */
  async play(isChatOpen: boolean = true) {
    if (!this.isInitialized || this.isMuted || !this.audio) {
      return;
    }

    // Don't play if tab is visible and chat is open
    if (this.isTabVisible() && isChatOpen) {
      return;
    }

    // On mobile: play if chat is not open OR tab is not visible
    // On desktop: play only if tab is not visible
    const shouldPlay = this.isMobileDevice()
      ? !isChatOpen || !this.isTabVisible()
      : !this.isTabVisible();

    if (shouldPlay) {
      try {
        // Reset audio to beginning
        this.audio.currentTime = 0;
        await this.audio.play();
      } catch (error) {
        // Handle autoplay policy errors silently
        console.warn('Could not play notification sound:', error);
      }
    }
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume(volume: number) {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Mute/unmute notifications
   */
  setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  /**
   * Get current muted state
   */
  getMuted(): boolean {
    return this.isMuted;
  }
}

// Export singleton instance
export const notificationSound = new NotificationSoundService();

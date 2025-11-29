import { describe, it, expect } from 'vitest';
import { createActor } from 'xstate';
import { matchmakingMachine } from '@/machines/matchmaking.machine';
import type { MatchDataMatched } from '@/types/matchmaking';

const mockMatchData: MatchDataMatched = {
  status: 'matched',
  roomId: 'test-room-123',
  channelName: 'test-channel',
  rtcToken: 'test-rtc-token',
  rtmToken: 'test-rtm-token',
  livekitHost: 'wss://livekit.example.com',
  partnerName: 'Test Partner',
  partnerUid: 456,
  partnerGender: 'male',
  expiresAt: Date.now() + 3600000,
};

describe('Matchmaking State Machine', () => {
  describe('Initial State', () => {
    it('should start in disconnected state', () => {
      const actor = createActor(matchmakingMachine);
      actor.start();
      expect(actor.getSnapshot().value).toBe('disconnected');
      actor.stop();
    });

    it('should have empty initial context', () => {
      const actor = createActor(matchmakingMachine);
      actor.start();
      const snapshot = actor.getSnapshot();
      expect(snapshot.context.matchData).toBeNull();
      expect(snapshot.context.error).toBeNull();
      expect(snapshot.context.userData).toBeNull();
      expect(snapshot.context.searchStartTime).toBeNull();
      expect(snapshot.context.reconnectAttempts).toBe(0);
      actor.stop();
    });
  });

  describe('Connection Flow', () => {
    it('should transition from disconnected to connecting on CONNECT', () => {
      const actor = createActor(matchmakingMachine);
      actor.start();

      actor.send({ type: 'CONNECT' });
      expect(actor.getSnapshot().value).toBe('connecting');
      actor.stop();
    });

    it('should transition from connecting to connected on CONNECTED', () => {
      const actor = createActor(matchmakingMachine);
      actor.start();

      actor.send({ type: 'CONNECT' });
      actor.send({ type: 'CONNECTED' });
      expect(actor.getSnapshot().value).toBe('connected');
      actor.stop();
    });

    it('should transition from connecting to error on ERROR', () => {
      const actor = createActor(matchmakingMachine);
      actor.start();

      actor.send({ type: 'CONNECT' });
      actor.send({ type: 'ERROR', error: 'Connection failed' });

      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe('error');
      expect(snapshot.context.error).toBe('Connection failed');
      actor.stop();
    });
  });

  describe('Matchmaking Flow', () => {
    it('should transition from connected to waiting on JOIN', () => {
      const actor = createActor(matchmakingMachine);
      actor.start();

      actor.send({ type: 'CONNECT' });
      actor.send({ type: 'CONNECTED' });
      actor.send({ type: 'JOIN', userData: { uid: 1, name: 'Test', gender: 'male' } });

      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe('waiting');
      expect(snapshot.context.userData).toEqual({ uid: 1, name: 'Test', gender: 'male' });
      expect(snapshot.context.searchStartTime).not.toBeNull();
      actor.stop();
    });

    it('should transition from waiting to matched on MATCHED', () => {
      const actor = createActor(matchmakingMachine);
      actor.start();

      actor.send({ type: 'CONNECT' });
      actor.send({ type: 'CONNECTED' });
      actor.send({ type: 'JOIN', userData: { uid: 1, name: 'Test', gender: 'male' } });
      actor.send({ type: 'MATCHED', matchData: mockMatchData });

      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe('matched');
      expect(snapshot.context.matchData).toEqual(mockMatchData);
      expect(snapshot.context.searchStartTime).toBeNull();
      actor.stop();
    });

    it('should transition from waiting to connected on CANCEL_SEARCH', () => {
      const actor = createActor(matchmakingMachine);
      actor.start();

      actor.send({ type: 'CONNECT' });
      actor.send({ type: 'CONNECTED' });
      actor.send({ type: 'JOIN', userData: { uid: 1, name: 'Test', gender: 'male' } });
      actor.send({ type: 'CANCEL_SEARCH' });

      expect(actor.getSnapshot().value).toBe('connected');
      actor.stop();
    });

    it('should transition from waiting to connected on SEARCH_TIMEOUT', () => {
      const actor = createActor(matchmakingMachine);
      actor.start();

      actor.send({ type: 'CONNECT' });
      actor.send({ type: 'CONNECTED' });
      actor.send({ type: 'JOIN', userData: { uid: 1, name: 'Test', gender: 'male' } });
      actor.send({ type: 'SEARCH_TIMEOUT' });

      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe('connected');
      expect(snapshot.context.error).toBe('No match found. Please try again.');
      actor.stop();
    });
  });

  describe('Matched State Transitions', () => {
    it('should transition from matched to connected on LEAVE_ROOM', () => {
      const actor = createActor(matchmakingMachine);
      actor.start();

      actor.send({ type: 'CONNECT' });
      actor.send({ type: 'CONNECTED' });
      actor.send({ type: 'JOIN', userData: { uid: 1, name: 'Test', gender: 'male' } });
      actor.send({ type: 'MATCHED', matchData: mockMatchData });
      actor.send({ type: 'LEAVE_ROOM' });

      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe('connected');
      expect(snapshot.context.matchData).toBeNull();
      actor.stop();
    });

    it('should transition from matched to connected on PARTNER_LEFT', () => {
      const actor = createActor(matchmakingMachine);
      actor.start();

      actor.send({ type: 'CONNECT' });
      actor.send({ type: 'CONNECTED' });
      actor.send({ type: 'JOIN', userData: { uid: 1, name: 'Test', gender: 'male' } });
      actor.send({ type: 'MATCHED', matchData: mockMatchData });
      actor.send({ type: 'PARTNER_LEFT' });

      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe('connected');
      expect(snapshot.context.matchData).toBeNull();
      actor.stop();
    });
  });

  describe('Disconnect Handling', () => {
    it('should transition to disconnected on DISCONNECT from any state', () => {
      const actor = createActor(matchmakingMachine);
      actor.start();

      // From connected
      actor.send({ type: 'CONNECT' });
      actor.send({ type: 'CONNECTED' });
      actor.send({ type: 'DISCONNECT' });
      expect(actor.getSnapshot().value).toBe('disconnected');
      actor.stop();
    });

    it('should reset context on DISCONNECT', () => {
      const actor = createActor(matchmakingMachine);
      actor.start();

      actor.send({ type: 'CONNECT' });
      actor.send({ type: 'CONNECTED' });
      actor.send({ type: 'JOIN', userData: { uid: 1, name: 'Test', gender: 'male' } });
      actor.send({ type: 'MATCHED', matchData: mockMatchData });
      actor.send({ type: 'DISCONNECT' });

      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe('disconnected');
      expect(snapshot.context.matchData).toBeNull();
      expect(snapshot.context.userData).toBeNull();
      expect(snapshot.context.error).toBeNull();
      actor.stop();
    });

    it('should handle CONNECTION_LOST from waiting state', () => {
      const actor = createActor(matchmakingMachine);
      actor.start();

      actor.send({ type: 'CONNECT' });
      actor.send({ type: 'CONNECTED' });
      actor.send({ type: 'JOIN', userData: { uid: 1, name: 'Test', gender: 'male' } });
      actor.send({ type: 'CONNECTION_LOST' });

      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe('disconnected');
      // Note: The disconnected state resets context including error
      // The error is set during transition but cleared on entry to disconnected
      expect(snapshot.context.matchData).toBeNull();
      actor.stop();
    });
  });

  describe('Error State', () => {
    it('should allow RETRY_CONNECT from error state', () => {
      const actor = createActor(matchmakingMachine);
      actor.start();

      actor.send({ type: 'CONNECT' });
      actor.send({ type: 'ERROR', error: 'Connection failed' });
      actor.send({ type: 'RETRY_CONNECT' });

      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe('connecting');
      expect(snapshot.context.reconnectAttempts).toBe(1);
      actor.stop();
    });

    it('should allow CONNECT from error state and clear error', () => {
      const actor = createActor(matchmakingMachine);
      actor.start();

      actor.send({ type: 'CONNECT' });
      actor.send({ type: 'ERROR', error: 'Connection failed' });
      actor.send({ type: 'CONNECT' });

      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe('connecting');
      expect(snapshot.context.error).toBeNull();
      actor.stop();
    });
  });
});

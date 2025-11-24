import { getSocketIOService, destroySocketIOService } from '../socketio';

// Mock socket.io-client
jest.mock('socket.io-client', () => {
  const mockSocket = {
    connected: false,
    connect: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn(),
    onAny: jest.fn(),
    emit: jest.fn(),
  };
  
  return {
    io: jest.fn(() => mockSocket),
  };
});

describe('socketio', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    destroySocketIOService();
  });

  describe('getSocketIOService', () => {
    it('should create a singleton instance', () => {
      const service1 = getSocketIOService();
      const service2 = getSocketIOService();
      expect(service1).toBe(service2);
    });

    it('should return SocketIOService instance', () => {
      const service = getSocketIOService();
      expect(service).toBeDefined();
      expect(typeof service.connect).toBe('function');
      expect(typeof service.disconnect).toBe('function');
      expect(typeof service.send).toBe('function');
    });
  });

  describe('destroySocketIOService', () => {
    it('should destroy the service instance', () => {
      const service1 = getSocketIOService();
      destroySocketIOService();
      const service2 = getSocketIOService();
      expect(service1).not.toBe(service2);
    });

    it('should not throw if no instance exists', () => {
      expect(() => destroySocketIOService()).not.toThrow();
    });
  });

  describe('SocketIOService', () => {
    it('should have all required methods', () => {
      const service = getSocketIOService();
      expect(typeof service.connect).toBe('function');
      expect(typeof service.disconnect).toBe('function');
      expect(typeof service.send).toBe('function');
      expect(typeof service.onMessage).toBe('function');
      expect(typeof service.onError).toBe('function');
      expect(typeof service.onClose).toBe('function');
      expect(typeof service.onOpen).toBe('function');
      expect(typeof service.isConnected).toBe('function');
      expect(typeof service.getConnectionState).toBe('function');
    });

    it('should return false for isConnected initially', () => {
      const service = getSocketIOService();
      expect(service.isConnected()).toBe(false);
    });

    it('should return disconnected state initially', () => {
      const service = getSocketIOService();
      expect(service.getConnectionState()).toBe('disconnected');
    });
  });
});

/**
 * Socket Service Exports
 */

export { SocketIOService, getSocketIOService, getSocketIOServiceAsync, destroySocketIOService } from './socketio.service';
export type { 
  MessageHandler, 
  ErrorHandler, 
  CloseHandler, 
  OpenHandler,
  SocketServiceConfig,
  ISocketService,
} from './types';

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

//4000: socket port, ex) localhost:4000/chat
@WebSocketGateway(4000, { /*cors: 'localhost:3000', */ namespace: 'chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  connectedClients: { [socketId: string]: number } = {}; // 연결된 클라이언트의 userId를 기록
  roomSocketMap: { [roomId: string]: string[] } = {}; // 각 채팅방에 속한 클라이언트 소켓 아이디를 기록

  constructor(private readonly chatService: ChatService) {}

  /**
   * 클라이언트에서 소켓 연결
   * @param client
   */
  handleConnection(client: Socket): void {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    console.log(`Client disconnected: ${client.id}`);
    const userId = this.connectedClients[client.id];
    if (userId) {
      delete this.connectedClients[client.id];
      const roomId = Object.keys(this.roomSocketMap).find(
        roomId => this.roomSocketMap[roomId].includes(client.id)
      );
      if (roomId) {
        this.roomSocketMap[roomId] = this.roomSocketMap[roomId].filter((socketId) => socketId !== client.id);
        if (this.roomSocketMap[roomId].length === 0) {
          delete this.roomSocketMap[roomId];
        }
      }
    }
  }

  /**
   * 채팅방 만들기
   * @param client
   * @param data
   */
  @SubscribeMessage('createRoom')
  createRoom(client: Socket, data: { userId: number, clientId: number }): void {
    const roomId = this.chatService.generateRoomId(data.userId, data.clientId);
    console.log(`Client ${client.id} joining room ${roomId}`);
    client.join(roomId);
    this.connectedClients[client.id] = data.userId;
    if (!this.roomSocketMap[roomId]) {
      this.roomSocketMap[roomId] = [];
    }
    this.roomSocketMap[roomId].push(client.id);

    this.chatService.createRoom(roomId, data.userId, data.clientId);
  }

  /**
   * 채팅방 나가기
   * @param client
   * @param data
   */
  @SubscribeMessage('leaveRoom')
  leaveRoom(client: Socket, data: { roomId: string; userId: number }): void {
    console.log(`user ${data.userId} leaving room ${data.roomId}`);
    client.leave(data.roomId);
  }

  /**
   * 메세지 보내기
   * @param client
   * @param data
   */
  @SubscribeMessage('sendChat')
  sendChat(client: Socket, data: { roomId: string; userId: number; content: string; imageUrl: string }): void {
    console.log(`Sending message in room ${data.roomId}`);
    const roomId = data.roomId;
    const userId = data.userId;
    const content = data.content;
    const imageUrl = data.imageUrl;
    this.server.to(roomId).emit('receiveChat', { userId, content, imageUrl });
    this.chatService.saveChat(data.roomId, data.userId, data.content, data.imageUrl);
  }

  /**
   * 채팅 내역 가져오기
   * @param client
   * @param data
   */
  @SubscribeMessage('getHistory')
  async getHistory(client: Socket, data: { roomId: string; userId: number; cursorId?: number; limit?: number }): Promise<void> {
    try {
      const chatHistory = await this.chatService.getHistory(data.roomId, data.userId, data.cursorId, data.limit);
      client.emit('chatHistory', chatHistory);
    } catch (error) {
      // 오류 처리
      console.error('Error fetching chat history:', error);
    }
  }
}

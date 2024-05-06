import { BadRequestException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatRoom } from '../entities/chat-room.entity';
import { Chat } from '../entities/chat.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoom) private readonly chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(Chat) private readonly chatRepository: Repository<Chat>,
  ) {}
  /**
   * 쪽지 방 생성
   * @param roomId
   * @param userId //본인 아이디
   * @param clientId //상대방 아이디
   */
  async createRoom(roomId: string, userId: number, clientId: number) {
    const existingRoom = await this.chatRoomRepository.findOne({
      where: {
        roomId: roomId,
      },
    });

    if (existingRoom) {
      return existingRoom;
    }

    const newRoom = new ChatRoom();
    newRoom.roomId = roomId;
    newRoom.userId = userId;
    newRoom.clientId = clientId;

    return this.chatRoomRepository.save(newRoom);
  }

  /**
   * 쪽지 방 확인
   * @param userId
   */
  getRooms(userId: number) {
    return this.chatRoomRepository.find({
      where: [
        { userId: userId, isUserDeleted: false },
        { clientId: userId, isClientDeleted: false },
  ],
      order: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * 쪽지 방 삭제
   * @param roomId
   * @param userId
   */
  async deleteRoom(roomId: string, userId: number) {
    const roomData = await this.chatRoomRepository.findOne({
      where: {
        roomId: roomId,
      },
    });
    if (!roomData) {
      throw new BadRequestException("[delete room] room not exist!");
    }

    let updateData = {};
    if (roomData.userId === userId) {
      updateData = { isUserDeleted: true };
    } else if (roomData.clientId === userId) {
      updateData = { isClientDeleted: true };
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException("[delete room] update result not exist");
    }
    await this.chatRoomRepository.update(roomId, updateData);
  }

  /**
   * 채팅 보내기
   * @param roomId
   * @param userId
   * @param content
   * @param imageUrl
   */
  async saveChat(roomId: string, userId: number, content: string, imageUrl: string) {
    const chat = new Chat();
    chat.roomId = roomId;
    chat.userId = userId;
    chat.content = content;
    chat.imageUrl = imageUrl;

    return await this.chatRepository.save(chat);
  }

  /**
   * 채팅 내용 내역
   * @param roomId
   * @param userId
   * @param cursorId
   * @param limit
   */
  async getHistory(roomId: string, userId: number, cursorId?: number, limit = 20) {
    let queryBuilder = this.chatRepository
      .createQueryBuilder('chat')
      .where('chat.roomId = :roomId', { roomId })
      .orderBy('chat.createdAt', 'ASC')
      .take(limit);

    if (cursorId) {
      queryBuilder = queryBuilder.andWhere('chat.id >= :cursorId', { cursorId });
    }

    const chats = await queryBuilder.getMany();

    return chats.map((chat) => ({
      id: chat.id,
      content: chat.content,
      createdAt: chat.createdAt,
      imageUrl: chat.imageUrl,
      isMe: chat.userId === userId,
    }));
  }

  /**
   * 채팅 roomId 생성
   * @param userId
   * @param clientId
   */
  generateRoomId(userId: number, clientId: number): string {
    const userIdStr = String(userId);
    const clientIdStr = String(clientId);
    const sortedIds = [userIdStr, clientIdStr].sort();

    const roomId = sortedIds.join('_');

    return roomId;
  }
}

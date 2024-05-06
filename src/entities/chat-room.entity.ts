import { Column, Entity, PrimaryColumn } from 'typeorm';
import { Common } from './common.entity';

@Entity()
export class ChatRoom extends Common {
  @PrimaryColumn({ name: 'room_id', comment: '채팅방 pk' })
  roomId: string;

  @Column({ name: 'user_id', comment: '채팅방을 생성한 유저 아이디' })
  userId: number;

  @Column({ name: 'client_id', comment: '채팅방을 수락한 유저 아이디' })
  clientId: number;

  @Column({ name: 'is_user_deleted', default: false, comment: 'user 채팅방 삭제여부' })
  isUserDeleted: boolean;

  @Column({ name: 'is_client_deleted', default: false, comment: 'client 채팅방 삭제여부' })
  isClientDeleted: boolean;
}
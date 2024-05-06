import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Common } from './common.entity';

@Entity()
export class Chat extends Common {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'room_id', comment: '채팅방 아이디' })
  roomId: string;

  @Column({ name: 'user_id', comment: '채팅방을 생성한 유저 아이디' })
  userId: number;

  @Column({ length: 500, comment: '메세지 내용' })
  content: string;

  @Column({ comment: '첨부 이밎 URL', nullable: true })
  imageUrl: string;
}
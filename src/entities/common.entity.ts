import { CreateDateColumn, DeleteDateColumn, UpdateDateColumn } from "typeorm";

/**
 * 공통으로 사용하는 필드 모음
 */
export abstract class Common {
  @CreateDateColumn({ name: 'created_at', type: 'timestamp', comment: '생성일자' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', comment: '수정일자' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', comment: '삭제일자' })
  deletedAt: Date;
}
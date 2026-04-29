import { STORES } from './constants'

export const DB_SCHEMA = Object.freeze({
  [STORES.USER]: {
    dexieSchema: 'id,&username,deleted_at,last_login',
    columns: {
      id: 'uuid primary key',
      username: 'varchar unique',
      password_hash: 'varchar bcrypt',
      daily_summons_left: 'int default 9',
      max_slime_capacity: 'int default 25',
      last_login: 'timestamp',
      created_at: 'timestamp',
      deleted_at: 'timestamp soft delete',
    },
  },
  [STORES.FOOD_FACTORY_STOCK]: {
    dexieSchema: 'id,&user_id,last_produced_at,deleted_at',
    columns: {
      id: 'uuid primary key',
      user_id: 'uuid foreign key users.id unique',
      quantity: 'int current stack',
      last_produced_at: 'timestamp',
      created_at: 'timestamp',
      deleted_at: 'timestamp',
    },
  },
  [STORES.FRIENDSHIP]: {
    dexieSchema: 'id,user_id,friend_user_id,&[user_id+friend_user_id],status,deleted_at',
    columns: {
      id: 'uuid primary key',
      user_id: 'uuid foreign key users.id',
      friend_user_id: 'uuid foreign key users.id',
      status: 'varchar pending|accepted',
      created_at: 'timestamp',
      deleted_at: 'timestamp used for unfriending',
    },
  },
  [STORES.SLIME]: {
    dexieSchema: 'id,user_id,rarity,type,level,last_fed_at,deleted_at',
    columns: {
      id: 'uuid primary key',
      user_id: 'uuid foreign key users.id',
      rarity: 'varchar Common|Rare|Mythical',
      type: 'varchar 3 types per rarity',
      color: 'varchar hex sprite tint',
      level: 'int 1 baby|2 teen|3 adult',
      last_fed_at: 'timestamp',
      created_at: 'timestamp',
      deleted_at: 'timestamp soft delete',
    },
  },
  [STORES.INTERACTION_LOG]: {
    dexieSchema: 'id,sender_id,target_slime_id,action_type,created_at',
    columns: {
      id: 'uuid primary key',
      sender_id: 'uuid foreign key users.id',
      target_slime_id: 'uuid foreign key slimes.id',
      action_type: 'varchar poke|feed',
      created_at: 'timestamp',
    },
  },
})

export const INDEX_ALIASES = Object.freeze({
  [STORES.USER]: {
    by_username: 'username',
    by_deleted_at: 'deleted_at',
    by_last_login: 'last_login',
  },
  [STORES.FOOD_FACTORY_STOCK]: {
    by_user_id: 'user_id',
    by_last_produced_at: 'last_produced_at',
    by_deleted_at: 'deleted_at',
  },
  [STORES.FRIENDSHIP]: {
    by_user_id: 'user_id',
    by_friend_user_id: 'friend_user_id',
    by_user_pair: '[user_id+friend_user_id]',
    by_status: 'status',
    by_deleted_at: 'deleted_at',
  },
  [STORES.SLIME]: {
    by_user_id: 'user_id',
    by_rarity: 'rarity',
    by_type: 'type',
    by_level: 'level',
    by_last_fed_at: 'last_fed_at',
    by_deleted_at: 'deleted_at',
  },
  [STORES.INTERACTION_LOG]: {
    by_sender_id: 'sender_id',
    by_target_slime_id: 'target_slime_id',
    by_action_type: 'action_type',
    by_created_at: 'created_at',
  },
})

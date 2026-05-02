import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('chat_messages', (table) => {
    table.uuid('message_id').primary().defaultTo(knex.raw('(UUID())'));
    table
      .integer('user_id')
      .unsigned()
      .notNullable()
      .references('user_id')
      .inTable('users')
      .onDelete('CASCADE');
    table.text('message').notNullable();
    table.enum('sender', ['user', 'ai']).notNullable();
    table.string('session_id', 36).nullable(); 
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['user_id', 'created_at']); 
    table.index(['user_id', 'session_id']); 
    table.index('session_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('chat_messages');
}
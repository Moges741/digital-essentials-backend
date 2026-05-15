import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.string('password_reset_token_hash', 255).nullable();
    table.timestamp('password_reset_expires_at').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('password_reset_expires_at');
    table.dropColumn('password_reset_token_hash');
  });
}

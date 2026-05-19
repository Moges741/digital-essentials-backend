import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('courses', (table) => {
    table.enum('topic', [
      'AI',
      'IoT',
      'Cloud Computing',
      'Cyber Security',
      'Safety Issue',
      'Software Development & Coding',
      'Digital Marketing',
      'E-Commerce',
    ]).notNullable().defaultTo('Software Development & Coding');
    
    // Store target roles as JSON array (MySQL doesn't allow defaults for JSON columns)
    table.json('target_roles').nullable();
  });

  // Set default value for existing rows
  await knex('courses').whereNull('target_roles').update({
    target_roles: knex.raw("JSON_ARRAY('student')"),
  });

  // Make it not null after setting defaults
  await knex.schema.alterTable('courses', (table) => {
    table.json('target_roles').notNullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('courses', (table) => {
    table.dropColumn('topic');
    table.dropColumn('target_roles');
  });
}

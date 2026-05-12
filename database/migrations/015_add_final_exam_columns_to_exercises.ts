import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('exercises', (table) => {
    table.boolean('is_final_exam')
         .notNullable()
         .defaultTo(false)
         .after('is_downloadable');
    table.tinyint('passing_score')
         .unsigned()
         .notNullable()
         .defaultTo(70)
         .after('is_final_exam');
    // Direct course link — final exam belongs to course not lesson
    table.integer('exam_course_id')
         .unsigned()
         .nullable()
         .after('passing_score');
    table.foreign('exam_course_id')
         .references('course_id')
         .inTable('courses')
         .onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('exercises', (table) => {
    table.dropForeign(['exam_course_id']);
    table.dropColumn('is_final_exam');
    table.dropColumn('passing_score');
    table.dropColumn('exam_course_id');
  });
}
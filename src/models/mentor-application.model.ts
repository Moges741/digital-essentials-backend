import db from "../config/db";

export interface MentorApplication {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  academic_file_url: string;
  national_id_url: string;
  linkedin_link?: string;
  github_link?: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
}

export const MentorApplicationModel = {
  async create(data: Omit<MentorApplication, "id" | "status" | "created_at" | "updated_at">): Promise<MentorApplication> {
    const [id] = await db("mentor_applications").insert(data);
    return this.findById(id);
  },

  async findById(id: number): Promise<MentorApplication> {
    return db("mentor_applications").where({ id }).first();
  },

  async findByEmail(email: string): Promise<MentorApplication | undefined> {
    return db("mentor_applications").where({ email }).first();
  },

  async findAll(): Promise<MentorApplication[]> {
    return db("mentor_applications").orderBy("created_at", "desc");
  },

  async updateStatus(id: number, status: "approved" | "rejected"): Promise<MentorApplication> {
    await db("mentor_applications")
      .where({ id })
      .update({ status, updated_at: db.fn.now() });
    return this.findById(id);
  }
};

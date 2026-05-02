export interface Certificate {
  certificate_id:  number;
  user_id:         number;
  course_id:       number;
  issued_at:       Date;
  certificate_url: string | null;
}

export interface CertificateWithDetails extends Certificate {
  course_title: string;
  user_name:    string;
  user_email:   string;
}

export interface IssueCertificateBody {
  // Certificate issued automatically when course completed
}
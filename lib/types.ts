export type AttendanceStatus = "Present" | "Late" | "Leave" | "Absent" | "NotRecorded";

export type DashboardSummary = {
  date: string;
  totalStudents: number;
  present: number;
  late: number;
  leave: number;
  absent: number;
  recorded: number;
  notRecorded: number;
};

export type Student = {
  id: number;
  studentCode: string;
  firstName: string;
  lastName: string;
  classroom: string;
  isActive: boolean;
  status: AttendanceStatus;
  remark?: string | null;
};

export type StudentPage = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  items: Student[];
};

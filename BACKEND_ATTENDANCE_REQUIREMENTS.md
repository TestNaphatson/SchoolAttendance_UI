# Backend contract: รอบวัน 03:00, Attendance Log และการลา

โปรเจกต์นี้เป็น UI และเชื่อมต่อ Backend ผ่าน `NEXT_PUBLIC_API_URL` การทำให้ข้อมูลคงอยู่จริงต้องให้ Backend ใช้กติกาต่อไปนี้

## รอบวันเช็กชื่อ

- ใช้เขตเวลา `Asia/Bangkok`
- วันเช็กชื่อใหม่เริ่มเวลา `03:00:00`
- ช่วง `00:00:00–02:59:59` ยังนับเป็นวันเช็กชื่อก่อนหน้า
- ห้ามลบแถว Attendance เดิมเมื่อขึ้นรอบใหม่
- สถานะของนักเรียนในรอบใหม่เป็น `NotRecorded` เพราะ query ด้วย `attendanceDate` วันใหม่ ไม่ใช่การแก้สถานะของ Log วันเก่า
- ควรมี unique index ที่ `(studentId, attendanceDate)`
- เวลาเช็กอินจริงเก็บเป็น UTC ใน `checkedInAt` แล้วแปลงเป็น `Asia/Bangkok` ตอนแสดงผล
- Scheduler เวลา 03:00 น. อาจปิดรอบก่อนหน้าและสร้าง `Absent` ให้ผู้ที่ไม่มีรายการ โดยต้องทำแบบ idempotent

## GET `/api/Attendances/history`

Query:

- `fromDate=YYYY-MM-DD`
- `toDate=YYYY-MM-DD`

Response:

```json
{
  "items": [
    {
      "id": 1,
      "attendanceDate": "2026-07-31",
      "studentCode": "65001",
      "firstName": "สมชาย",
      "lastName": "ใจดี",
      "classroom": "ม.1/1",
      "status": "Present",
      "checkedInAt": "2026-07-31T01:12:30Z",
      "remark": null,
      "leaveType": null,
      "leaveApprovalStatus": null
    }
  ],
  "totalItems": 1
}
```

Endpoint นี้ต้องอนุญาตเฉพาะ Admin/บุคลากรที่มีสิทธิ์ดูประวัติ

## POST `/api/StudentCheckIn/leave` สำหรับการลา

Request:

```json
{
  "leaveType": "Sick",
  "reason": "มีไข้สูง"
}
```

Backend ดึงนักเรียนจาก access token โดยตรงและสร้าง Attendance ของวันปัจจุบันเป็น `Leave`

Response:

```json
{
  "message": "บันทึกการลาเรียบร้อยแล้ว"
}
```

Backend ปัจจุบันเก็บประเภทลาและเหตุผลรวมกันใน `remark` เช่น `ลาป่วย: มีไข้สูง`

หากต้องการแยกคอลัมน์จริงในฐานข้อมูล ให้เพิ่ม `leaveType` และ `leaveApprovalStatus` ใน Attendance entity, DTO, migration และ Swagger ก่อน แล้วจึงแยกสองค่านี้ออกจาก `remark` โดยยังใช้ unique key `(studentId, attendanceDate)` เช่นเดียวกับการเช็กอิน

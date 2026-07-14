# Security Specification - Firebase Security Rules

## 1. Data Invariants
- **Authentication**: All writes must be authenticated. Users can view/check their own attendance and profiles, or write their own attendance check-ins. Admins have complete read/write access.
- **Identity Integrity**: For check-ins (`attendance`), a standard employee can only create/update records where `employeeId` matches their authenticated `uid`.
- **Temporal Consistency**: The `createdAt` and `updatedAt` timestamps must match the server-time or existing database records (no forward-dating or backward-dating by clients).
- **Immutable Keys**: Core identifiers like `id`, `employeeId`, `date` cannot be changed after creation.
- **Strict Size/Format Constraints**: High-density fields like Base64 images and notes must conform to reasonable size bounds (e.g., photo fields must be string and notes must be <= 500 characters).

---

## 2. The "Dirty Dozen" Payloads
These malicious or illegal payloads try to bypass security, overwrite other users' data, or execute unauthorized operations.

### Case 1: Anonymous Write
*Goal: Write an employee profile or attendance without signing in.*
```json
{
  "collection": "attendance",
  "docId": "pair_anon_2026-07-14",
  "payload": {
    "id": "pair_anon_2026-07-14",
    "employeeId": "emp_hendra",
    "date": "2026-07-14",
    "dateLabel": "Selasa, 14 Juli 2026",
    "status": "Hadir"
  },
  "auth": null
}
```

### Case 2: Spoof Identity (Create)
*Goal: Authenticated user A tries to create an attendance record for employee B.*
```json
{
  "collection": "attendance",
  "docId": "pair_b_2026-07-14",
  "payload": {
    "id": "pair_b_2026-07-14",
    "employeeId": "emp_budi",
    "date": "2026-07-14",
    "dateLabel": "Selasa, 14 Juli 2026",
    "status": "Hadir"
  },
  "auth": { "uid": "emp_hendra" }
}
```

### Case 3: Identity Swapping (Update)
*Goal: Authenticated user A tries to change the employeeId of an existing record to employee B.*
```json
{
  "collection": "attendance",
  "docId": "pair_hendra_2026-07-14",
  "payload": {
    "employeeId": "emp_budi"
  },
  "auth": { "uid": "emp_hendra" }
}
```

### Case 4: Rogue Admin Promotion
*Goal: User attempts to declare themselves an admin by writing to the `/admins` collection or modifying employee metadata.*
```json
{
  "collection": "employees",
  "docId": "emp_hendra",
  "payload": {
    "id": "emp_hendra",
    "name": "Arch. Hendra Kurniawan",
    "jabatan": "Principal Architect",
    "posisi": "Kantor",
    "isAdmin": true
  },
  "auth": { "uid": "emp_hendra" }
}
```

### Case 5: Infinite Notes Injection (Denial of Wallet)
*Goal: Injecting a multi-megabyte string into notes to consume server memory/storage.*
```json
{
  "collection": "attendance",
  "docId": "pair_hendra_2026-07-14",
  "payload": {
    "notes": "A".repeat(1000000)
  },
  "auth": { "uid": "emp_hendra" }
}
```

### Case 6: Invalid Enum Value
*Goal: Setting an arbitrary text string for status.*
```json
{
  "collection": "attendance",
  "docId": "pair_hendra_2026-07-14",
  "payload": {
    "id": "pair_hendra_2026-07-14",
    "employeeId": "emp_hendra",
    "date": "2026-07-14",
    "dateLabel": "Selasa, 14 Juli 2026",
    "status": "MALICIOUS_SUPER_STATUS"
  },
  "auth": { "uid": "emp_hendra" }
}
```

### Case 7: Future-Dating Check-in
*Goal: Setting a timestamp that is in the future instead of server-time.*
```json
{
  "collection": "attendance",
  "docId": "pair_hendra_2026-07-14",
  "payload": {
    "masuk": {
      "timestamp": "23:59:59",
      "location": { "latitude": 0, "longitude": 0 },
      "photoUrl": "some_photo",
      "notes": "In the future"
    }
  },
  "auth": { "uid": "emp_hendra" }
}
```

### Case 8: Malicious ID Poisoning
*Goal: Create a document with an extremely long or path-injection ID.*
```json
{
  "collection": "employees",
  "docId": "emp_hendra/subcollection/maliciousID....",
  "payload": {
    "id": "invalid",
    "name": "Poisoner"
  },
  "auth": { "uid": "emp_hendra" }
}
```

### Case 9: Altering Work Placement Without Authorization
*Goal: Standard employee trying to change their placement `posisi` in profile.*
```json
{
  "collection": "employees",
  "docId": "emp_hendra",
  "payload": {
    "posisi": "Lapangan"
  },
  "auth": { "uid": "emp_hendra" }
}
```

### Case 10: Deleting Attendance Records
*Goal: Standard employee trying to delete an old attendance record.*
```json
{
  "collection": "attendance",
  "docId": "pair_hendra_2026-07-10",
  "action": "delete",
  "auth": { "uid": "emp_hendra" }
}
```

### Case 11: Stealing Other Employee's Profile PII
*Goal: Attempting to retrieve detailed profiles of employees when unauthorized (such as secret data).*
```json
{
  "collection": "employees",
  "docId": "emp_budi",
  "action": "get",
  "auth": { "uid": "emp_hendra" }
}
```

### Case 12: Overwriting Existing Complete Logs
*Goal: Overwriting a completed record containing a clock-out signature.*
```json
{
  "collection": "attendance",
  "docId": "pair_hendra_2026-07-10",
  "payload": {
    "status": "Telat"
  },
  "auth": { "uid": "emp_hendra" }
}
```

---

## 3. The Conceptual Test Suite
The security rules must enforce all constraints so that the client SDK receives `PERMISSION_DENIED` for any of the above operations.
Our security rules defined in `firestore.rules` will explicitly reject these cases.

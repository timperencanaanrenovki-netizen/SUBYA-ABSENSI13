# Firebase Security Specification - DIARSITEKI ABSENSI

This document defines the security specification, invariants, and threat vectors ("Dirty Dozen" payloads) for the Diarsiteki Absensi application.

## 1. Data Invariants

1. **Employee Verification**:
   - An employee ID must be a valid, non-empty, alphanumeric string.
   - The field `posisi` must be strictly restricted to values: `Kantor` or `Lapangan`.
   - The field `jabatan` must be a valid work title of reasonable length (max 100 characters).

2. **Attendance Integrity**:
   - Each `attendancePair` document must refer to an existing `employeeId`.
   - The document ID should adhere to the format `pair_${employeeId}_${date}` to prevent duplicate entries for an employee on a single day.
   - The `date` must conform to the `YYYY-MM-DD` format.
   - The `status` must strictly be one of: `Hadir`, `Telat`, `Sakit`, `Izin`, `Cuti`.
   - `masuk` and `pulang` details, if present, must contain a valid timestamp (`HH:MM:SS`), non-empty watermarked `photoUrl`, and optional numeric GPS location coordinates.

---

## 2. The "Dirty Dozen" Payloads (Negative Threat Vectors)

The following 12 malicious payloads represent attempts to compromise Identity, Integrity, or State within the application:

### Payload 1: ID Poisoning (Resource Poisoning)
- **Path**: `/employees/emp_MALICIOUS_LONG_JUNK_ID_SPAM_TRASH_1234567890`
- **Payload**: Attempting to create an employee with an ID exceeding 128 characters or containing non-alphanumeric junk characters.
- **Expected Result**: `PERMISSION_DENIED`

### Payload 2: Self-Assigned Administrative Privileges
- **Path**: `/employees/emp_hacker`
- **Payload**: `{ "id": "emp_hacker", "name": "Hacker", "jabatan": "Principal Architect", "posisi": "Kantor", "photoUrl": "...", "isAdmin": true }`
- **Expected Result**: `PERMISSION_DENIED` (No unsolicited admin fields allowed inside user profiles)

### Payload 3: Invalid Employee Work Location
- **Path**: `/employees/emp_dani`
- **Payload**: `{ "id": "emp_dani", "name": "Dani", "jabatan": "Site Manager", "posisi": "Hacker_Space", "photoUrl": "..." }`
- **Expected Result**: `PERMISSION_DENIED` (`posisi` must be 'Kantor' or 'Lapangan')

### Payload 4: Invalid Attendance Date Format
- **Path**: `/attendance/pair_emp_hendra_invalid_date`
- **Payload**: `{ "id": "pair_emp_hendra_invalid_date", "employeeId": "emp_hendra", "date": "13-07-2026", "dateLabel": "Senin, 13 Juli 2026", "status": "Hadir" }`
- **Expected Result**: `PERMISSION_DENIED` (date must be YYYY-MM-DD)

### Payload 5: Spoofed Attendance Status (Illegal State)
- **Path**: `/attendance/pair_emp_hendra_2026-07-13`
- **Payload**: `{ "id": "pair_emp_hendra_2026-07-13", "employeeId": "emp_hendra", "date": "2026-07-13", "dateLabel": "Senin, 13 Juli 2026", "status": "SuperHadir" }`
- **Expected Result**: `PERMISSION_DENIED` (status must be within the defined enum list)

### Payload 6: Missing Required Attendance Fields on Create
- **Path**: `/attendance/pair_emp_hendra_2026-07-13`
- **Payload**: `{ "id": "pair_emp_hendra_2026-07-13", "employeeId": "emp_hendra" }`
- **Expected Result**: `PERMISSION_DENIED` (missing `date`, `dateLabel`, `status`)

### Payload 7: Orphaned Attendance Record (Non-existent Employee)
- **Path**: `/attendance/pair_fake_emp_2026-07-13`
- **Payload**: `{ "id": "pair_fake_emp_2026-07-13", "employeeId": "fake_employee_id", "date": "2026-07-13", "dateLabel": "Senin, 13 Juli 2026", "status": "Hadir" }`
- **Expected Result**: `PERMISSION_DENIED` (foreign key constraint: employee must exist in `/employees`)

### Payload 8: Write-Bypass of Terminal Status
- **Path**: `/attendance/pair_emp_sarah_2026-07-11` (Existing is 'Sakit')
- **Payload**: Trying to update status from 'Sakit' (Terminal) to 'Hadir' without admin authorization.
- **Expected Result**: `PERMISSION_DENIED`

### Payload 9: Invalid Geo-Coordinates Injection
- **Path**: `/attendance/pair_emp_hendra_2026-07-13`
- **Payload**: `{ "id": "pair_emp_hendra_2026-07-13", "employeeId": "emp_hendra", "date": "2026-07-13", "dateLabel": "Senin, 13 Juli 2026", "status": "Hadir", "masuk": { "timestamp": "08:00:00", "photoUrl": "...", "location": { "latitude": 95.0, "longitude": 200.0 } } }`
- **Expected Result**: `PERMISSION_DENIED` (latitude/longitude out of valid geographic ranges)

### Payload 10: Anonymous Public Query Scraping (Denial of Wallet)
- **Operation**: Public unauthenticated read of all attendance logs.
- **Expected Result**: `PERMISSION_DENIED`

### Payload 11: Tampering with Other Employees' Existing Records
- **Path**: `/attendance/pair_emp_hendra_2026-07-13`
- **Payload**: User authenticated as `emp_sarah` trying to edit `emp_hendra`'s clock-in details.
- **Expected Result**: `PERMISSION_DENIED`

### Payload 12: Extra Ghost Fields Insertion (Shadow Update)
- **Path**: `/employees/emp_hendra`
- **Payload**: `{ "id": "emp_hendra", "name": "Hendra", "jabatan": "Principal", "posisi": "Kantor", "photoUrl": "...", "extraGhostField": "maliciousValue" }`
- **Expected Result**: `PERMISSION_DENIED` (Strict schema prevents ghost fields)

---

## 3. The Test Runner Spec

The accompanying rules inside `firestore.rules` will be evaluated to ensure that all twelve payloads are blocked effectively.

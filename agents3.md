# DISTRICT DAK MANAGEMENT SYSTEM (DDMS)

## Software Requirement, Implementation & Future Roadmap Document

---

# 1. Project Overview

District DAK Management System (DDMS) is a web-based workflow management application developed for the office of the District Collector to digitize the receipt, registration, assignment, monitoring, tracking, escalation, and disposal of official correspondence (DAK).

The system eliminates manual registers and enables complete lifecycle management of DAK from receipt to disposal.

---

# 2. Objectives

* Digital DAK registration.
* Centralized correspondence management.
* Department-wise assignment.
* Internal section assignment.
* Status tracking.
* SLA monitoring.
* Escalation management.
* Action Taken Report (ATR) monitoring.
* Disposal and closure.
* Notifications and alerts.
* Complete audit trail.

---

# 3. Technology Stack

Frontend:

* Next.js 15
* React
* TypeScript
* Tailwind CSS
* Shadcn UI

Backend:

* Next.js Server Actions
* Supabase

Database:

* PostgreSQL

Authentication:

* Supabase Auth

Storage:

* Supabase Storage

Reporting:

* PDF Export
* Excel Export

Deployment:

* VPS / Cloud Server

---

# 4. User Roles

1. Super User (ACP)
2. Collector
3. ADM
4. DAK Operator
5. Department Officer
6. Internal Section User

---

# 5. Stage 1 – Authentication System

Implemented:

* Login.
* Session management.
* Role-based access.
* Permission checking.
* Secure authentication.

---

# 6. Stage 2 – Dashboard

Implemented:

* Dashboard cards.
* Pending DAK count.
* Overdue DAK count.
* Department statistics.
* Recent DAK.

---

# 7. Stage 3 – DAK Registration

Features:

* New DAK entry.
* Subject.
* Sender details.
* Priority.
* Due date.
* Remarks.
* Auto DAK number generation.

---

# 8. Stage 4 – Department Management

Features:

* Department master.
* Department users.
* Department mapping.

Examples:

* Revenue
* Medical
* PWD
* PHED
* Police
* Transport
* DOIT&C

---

# 9. Stage 5 – DAK Sources

Implemented sources:

* Chief Minister Office
* Chief Secretary
* Secretariat
* MP
* MLA
* Jan Sunwai
* Ratri Chaupal
* Public Grievance

---

# 10. Stage 6 – DAK Assignment

Features:

* Department assignment.
* Internal section assignment.
* Officer assignment.
* Assignment history.

Internal Sections:

* General
* Development
* Court
* Legal
* RTI
* Accounts
* Store
* LR
* ADM
* ACEM

---

# 11. Stage 7 – File Attachments

Features:

* Upload documents.
* PDF attachments.
* Image attachments.
* Storage management.

---

# 12. Stage 8 – Dashboard Analytics

Implemented:

* Total DAK.
* Pending DAK.
* Overdue DAK.
* Department statistics.

---

# 13. Stage 9 – Reports

Reports:

* Pending Report.
* Overdue Report.
* Department Report.
* Source Report.
* Section Report.

Filters:

* Department.
* Source.
* Status.
* Priority.
* Date.

---

# 14. Stage 10 – Export System

Features:

* PDF export.
* Excel export.
* Filtered reports.
* Role-based export.

---

# 15. Stage 11 – User Management

Collector and ACP can:

* Create users.
* Reset password.
* Enable users.
* Disable users.
* Map users to departments.

User information:

* Name
* Designation
* Mobile
* Email
* Role

---

# 16. Stage 12 – Notifications

Features:

* Assignment notifications.
* Status notifications.
* ATR notifications.
* Overdue alerts.

---

# 17. Stage 13 – Activity Log

Tracks:

* DAK creation.
* Assignment.
* Reassignment.
* Status changes.
* Disposal.
* Closure.

---

# 18. Stage 14 – DAK Timeline

Timeline events:

* Created.
* Assigned.
* Remark added.
* ATR submitted.
* Escalated.
* Disposed.
* Closed.

---

# 19. Stage 15 – SLA & Escalation

Features:

* Due date monitoring.
* Overdue detection.
* Escalation levels.
* Escalation notifications.

---

# 20. Stage 16 – Remarks & ATR

Features:

* Remarks.
* Internal notes.
* ATR submission.
* ATR attachments.

---

# 21. Stage 17 – Disposal & Closure

Features:

* Disposal remarks.
* Closure date.
* Disposal authority.
* Final decision.

---

# 22. Security Features

* RBAC.
* Session protection.
* Permission checks.
* Audit logs.
* Role isolation.

---

# 23. Database Modules

Main tables:

* users
* departments
* dak_entries
* dak_sources
* assignment_units
* notifications
* dak_remarks
* dak_atr
* activity_logs

---

# 24. Workflow

DAK Received

↓

DAK Entry

↓

Assignment

↓

Officer Action

↓

Remarks

↓

ATR

↓

Collector Review

↓

Disposal

↓

Closure

---

# 25. Benefits

* Paperless workflow.
* Accountability.
* Faster disposal.
* Complete tracking.
* Transparency.
* Monitoring.
* Audit compliance.

---

# 26. Future Roadmap

## Stage 18

Email alerts.

SMS alerts.

WhatsApp alerts.

---

## Stage 19

Realtime notifications.

Live dashboard.

Websocket updates.

---

## Stage 20

Audit monitoring.

Security dashboard.

Login tracking.

---

## Stage 21

Mobile application.

Progressive Web App.

Offline support.

---

## Stage 22

Production deployment.

SSL.

Backup.

Disaster recovery.

---

## Stage 23

eOffice integration.

NIC integration.

Jan Sunwai integration.

---

## Stage 24

AI-powered analytics.

Priority prediction.

Auto categorization.

AI summarization.

---

# 27. Conclusion

The District DAK Management System provides a complete digital workflow for official correspondence management within the district administration.

The system ensures transparency, accountability, monitoring, escalation, and timely disposal of government correspondence while significantly reducing manual effort and paper-based processes.

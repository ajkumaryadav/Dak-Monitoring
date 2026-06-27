<!-- BEGIN:nextjs-agent-rules -->



# DAK Monitoring System AI Agent Instructions

Project Name:
District DAK & Administrative Monitoring System

Project Goal:
Develop a district-level governance and DAK monitoring platform for Collectorate administration.

Technology Stack:

* Next.js 15
* TypeScript
* Tailwind CSS
* shadcn/ui
* Supabase PostgreSQL
* Supabase Auth
* Supabase Storage

Development Rules:

1. Build module by module.
2. Never modify unrelated files.
3. Use reusable components.
4. Follow TypeScript strict mode.
5. Use server actions whenever possible.
6. Maintain responsive UI.
7. Use shadcn components.
8. Create loading and error states.
9. Use role-based access.
10. Write clean comments.

Administrative Roles:

* Collector
* ADM
* District Officer
* Block Officer
* Clerk
* Data Entry Operator

Modules:

1. Authentication
2. DAK Registration
3. Workflow Engine
4. Dashboard
5. Timeline
6. Notifications
7. Escalation
8. Reports

Workflow:
DAK Received
→ Diary Entry
→ Collector Assignment
→ Department Allocation
→ Task Creation
→ Progress Updates
→ Review
→ Disposal
→ Closure

Status Values:

* Received
* Assigned
* Under Process
* Pending
* Escalated
* Disposed
* Closed

Priority Levels:

* Routine
* Important
* Urgent
* Immediate

Coding Guidelines:

* Use server components by default.
* Validate forms with Zod.
* Use React Hook Form.
* Store environment variables in .env.local.
* Use Supabase Row Level Security.
* Create audit logs for all actions.



Future Features:

* OCR
* AI Summary
* WhatsApp alerts
* Collector Copilot
* Predictive Analytics

Always ask before generating large architectural changes.



<!-- END:nextjs-agent-rules -->

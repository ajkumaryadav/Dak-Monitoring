You are working on an existing Next.js 15 + Supabase + TypeScript + shadcn/ui based DAK Monitoring System.

Read AGENT.md and preserve the current architecture, RBAC, authentication, workflow, reports, and dashboard.

Implement the following enhancements.

# 1. DAK SOURCE MASTER

Create a new master table:

* dak_sources
* id (uuid)
* source_name
* source_category
* created_at

Default sources:

* Chief Secretary
* CMO
* Secretariat
* Minister
* MP
* MLA
* Jan Sunwai
* Ratri Chaupal
* CM Helpline
* Public Grievance
* Court
* Department
* Public
* Email
* Other

Add source_id to dak_entries.

DAK Source is mandatory.

---

# 2. DAK REGISTRATION FORM

Add a required dropdown:

DAK Source *

Display source names alphabetically.

Store source_id in dak_entries.

---

# 3. SOURCE EVERYWHERE

Display DAK Source in:

* Dashboard recent DAK
* All DAK table
* DAK details page
* Pending DAK
* Completed DAK
* Reports
* Exports
* Search filters

---

# 4. SOURCE DASHBOARD

Add dashboard widgets:

* CMO DAK
* Jan Sunwai DAK
* MLA References
* Chief Secretary References
* Court Cases

Add source-wise charts.

---

# 5. DEPARTMENT MASTER

Departments must always load alphabetically.

Example:

* BIDA
* Devsthan
* DOIT&C
* Food & Supply
* Home
* Irrigation
* JVVNL
* LSG
* Medical & Health
* Minority
* PHED
* Police
* Pollution Control
* PWD
* Revenue
* Rural Development
* SJE
* Statistics
* Transport
* Treasury
* Watershed

Update getDepartments() accordingly.

---

# 6. DEPARTMENT + USER MAPPING

Assignment dropdown should display:

Revenue — Ajay Sharma

Medical & Health — Dr Meena

Police — Rajesh Kumar

Display:

Department Name — Officer Name

If no officer exists:

Revenue — Not Assigned

---

# 7. INTERNAL COLLECTORATE SECTIONS

Create assignment_units table.

Columns:

* id
* unit_name
* unit_type

unit_type:

* department
* section

Internal sections:

* Development
* Accounts
* PA Cell
* General
* LR
* Court
* Legal
* RTI
* Panchayati Raj
* ADM
* Store

---

# 8. ASSIGNMENT TYPE

Collector and ADM can choose:

Assignment Type

( ) Department

( ) Internal Section

If Department selected:

Show department dropdown.

If Internal Section selected:

Show section dropdown.

---

# 9. ROLE RULES

Collector:

* Assign departments
* Assign sections
* Reassign DAK

ADM:

* Assign departments
* Assign sections

DLO:

* Update status

DEO:

* Create DAK only

---

# 10. DAK DETAILS PAGE

Show:

* DAK Source
* Assignment Type
* Assigned Department
* Assigned Section
* Assigned Officer

---

# 11. REPORTS

Create:

* Source-wise reports
* Department-wise reports
* Section-wise reports
* CMO pending report
* Jan Sunwai report
* MLA references report
* Court cases report

---

# 12. FILTERS

Add filters:

* Source
* Department
* Section
* Status
* Priority
* Date

---

# 13. DASHBOARD

Collector dashboard:

* Total DAK
* Pending DAK
* Overdue DAK
* CMO DAK
* Jan Sunwai DAK
* MLA References
* Internal Section Pending
* Department Pending

---

# 14. DATABASE MIGRATIONS

Generate all required SQL migrations.

Preserve existing data.

Do not break existing DAK entries.

Use nullable columns where necessary.

---

# 15. UI

Use shadcn/ui.

Maintain existing government dashboard styling.

Responsive design.

Do not remove existing features.

Implement incrementally with proper TypeScript types.

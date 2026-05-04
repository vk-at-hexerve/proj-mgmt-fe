# Nexus Project Managemtent Tool

---

# Part 1 — Architecture, Authentication & Dashboard

---

## 1. Application Architecture Overview

### 1.1 Tech Stack
| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router, `'use client'` pages) |
| UI Library | shadcn/ui components + Tailwind CSS |
| Icons | `lucide-react` |
| State | React Context (`AppProvider` in `lib/app-context.tsx`) |
| API | RESTful backend at `http://127.0.0.1:8100/api/v1` |
| Auth | JWT stored in `localStorage` (`auth_token`) |
| Charts | `recharts` (Reports page) |

### 1.2 Global Layout Pattern
Every authenticated page follows the same shell:

```
┌─────────────────────────────────────────────┐
│  AppSidebar  │  AppHeader                   │
│  (left)      │──────────────────────────────│
│              │  Main Content Area           │
│              │  (scrollable)                │
│              │                              │
│              │──────────────────────────────│
│              │  AICopilot (floating panel)  │
└─────────────────────────────────────────────┘
```

### 1.3 Navigation Structure (AppSidebar)

The sidebar is collapsible (`w-64` → `w-[72px]`) and organized into three sections:

**Main Navigation:**
| Label | Route | Icon |
|-------|-------|------|
| Dashboard | `/` | LayoutDashboard |
| Project (expandable) | `/projects` | FolderKanban |
| My Tasks | `/tasks` | ListTodo |
| Calendar | `/calendar` | Calendar |
| Reports | `/reports` | BarChart3 |

**Management:**
| Label | Route | Icon |
|-------|-------|------|
| Hierarchy | `/hierarchy` | Network |
| Portfolios | `/portfolios` | Layers |
| Programs | `/programs` | Target |
| Teams | `/teams` | Users |
| Resources | `/resources` | PieChart |
| Time Tracking | `/timetracking` | Clock |

**Finance:**
| Label | Route | Icon |
|-------|-------|------|
| Clients | `/clients` | UserCircle |
| Invoices | `/invoices` | Receipt |
| Products | `/products` | Package |
| Settings | `/settings` | Settings |

**Sidebar Features:**
- **Project Selector Dropdown:** Switch active project; shows project key badge + name; includes "Create new project" option
- **Search Bar:** Opens global search modal (`⌘K` shortcut)
- **AI Copilot Button:** Gradient button at bottom opens AI assistant panel
- **User Section:** Avatar + name/role; dropdown with Settings, Notifications, Sign out

### 1.4 AppHeader

The top header bar includes:
- **Title + Subtitle** (page-specific)
- **Quick Search** button (⌘K)
- **Notifications Bell** — dropdown showing AI Insights & Alerts (overdue tasks, high-priority items)
- **Help** and **Feedback** icon buttons
- **Quick Create (+)** dropdown → New Task, New Project, New Sprint, Import from Jira/ClickUp
- **User Avatar** dropdown → Profile, Settings, Log out

### 1.5 State Management (AppContext)

The `AppProvider` is the single source of truth. On authentication, it fires parallel API requests to load:
- `/tasks` → `tasks[]`
- `/projects` → `projects[]`
- `/teams` → `teams[]`
- `/clients` → `clients[]`
- `/users` → `users[]`
- `/sprints` → `sprints[]`
- `/time-entries` → `timeEntries[]`

**Data Flow Pattern:** Optimistic UI updates → API call → on failure: rollback state + error toast.

---

## 2. Authentication Module

### 2.1 Login Page (`/login`)

**Route:** `/login`

**UI Elements:**
- Email input field
- Password input field
- "Sign In" button (disabled while loading)
- "Don't have an account? Sign up" link → `/signup`
- Loading spinner during authentication

**Workflow:**
1. User enters email + password
2. Clicks "Sign In"
3. `loginAction()` in AppContext calls `login()` from `lib/auth.ts`
4. `login()` sends `POST /api/v1/auth/login` with `URLSearchParams` (OAuth2 format: `username` + `password`)
5. On success: JWT token saved to `localStorage` as `auth_token`, redirects to `/`
6. On failure: Error toast displayed, form stays populated

**Validations:**
- Both fields required (HTML `required` attribute)
- Empty submission prevented

### 2.2 Signup Page (`/signup`)

**Route:** `/signup`

**UI Elements:**
- Name input
- Email input
- Password input
- "Create Account" button
- "Already have an account? Sign in" link → `/login`

**Workflow:**
1. User fills name, email, password
2. Clicks "Create Account"
3. `signupAction()` calls `signup()` from `lib/auth.ts`
4. `signup()` sends `POST /api/v1/auth/register` with JSON body
5. On success: Toast "Account created", redirects to `/login`
6. On failure: Error toast with message

---

## 3. Dashboard Module (`/`)

**Route:** `/` (root page)

### 3.1 Dashboard Layout

The dashboard is fully **customizable** with an edit mode:

**Controls Bar:**
- "Customize Dashboard" button → toggles edit mode
- In edit mode: "Widget Settings" modal, "Reset" button, "Done Editing" button

### 3.2 Metric Widgets (Top Row)

6 configurable metric cards in a responsive grid (`xl:grid-cols-6`):

| Metric | Source | Icon |
|--------|--------|------|
| Active Projects | `projects.filter(p => p.status === 'active').length` | FolderKanban |
| Tasks Completed | `tasks.filter(t => t.status === 'closed').length` | ListChecks |
| In Progress | `tasks.filter(t => t.status === 'in-progress').length` | Clock |
| Overdue | Tasks with `dueDate < now` and not closed | Calendar |
| Team Utilization | Calculated from allocations | Users |
| AI Confidence | Average `aiConfidence` across projects | Sparkles |

**Edit Mode Features:**
- Reorder widgets (up/down arrows)
- Hide/show widgets (X button or toggle in settings modal)
- Reset to default layout

### 3.3 Panel Widgets (Main Grid)

4 configurable panels in a `lg:grid-cols-3` layout:

| Panel | Span | Component |
|-------|------|-----------|
| Active Projects | 2 cols | `<ProjectsOverview />` |
| Recent Tasks | 2 cols | `<RecentTasks />` |
| Sprint Progress | 1 col | `<SprintProgress />` |
| AI Insights | 1 col | `<AIInsightsPanel />` |

### 3.4 Widget Settings Modal

- Lists all metrics and panels with toggle switches
- Drag handle icons (visual indicator for future drag support)
- Reorder buttons (up/down per item)
- "Reset to Default" button
- Size labels ("Wide" / "Normal" for panels)

### 3.5 Greeting Logic
- Before 12:00 → "Good morning, {firstName}"
- 12:00–18:00 → "Good afternoon, {firstName}"
- After 18:00 → "Good evening, {firstName}"

---

## 4. Project Management Module (`/projects`)

**Route:** `/projects`

### 4.1 View Modes

The Projects page supports **5 view modes** via tabs:

| View | Description |
|------|-------------|
| **Kanban** | Drag-and-drop columns by task status |
| **List** | Sortable table with inline actions |
| **Gantt** | Timeline visualization of tasks |
| **Calendar** | Month/week view of task dates |
| **Backlog** | Sprint backlog management |

### 4.2 Project Header

- Project name, key badge, description
- Toolbar: View mode tabs, filters (status, priority, assignee, type), search input
- **"+ Create Task"** button → opens create-task modal
- Sprint selector dropdown (filters tasks by sprint)

### 4.3 Kanban Board

**Columns:** Open → Assigned → In Progress → Pending Approval → On Hold → Closed

Each task card shows:
- Type icon (colored by type: epic/story/task/subtask/bug)
- Task key badge (e.g., `PROJ-001`)
- Title
- Priority indicator (color-coded)
- Assignee avatar
- Due date (if set)
- Story points badge
- Tag badges

**Interactions:**
- Click card → opens task detail view
- Drag card between columns → calls `updateTaskStatus(taskId, newStatus)`
- Context menu (⋮) → Edit, Assign, Change Priority, Delete

### 4.4 Sprint Management

**Creating a Sprint:**
1. Click "Create Sprint" in the Backlog view or via header Create dropdown
2. Modal fields: Name, Goal (textarea), Start Date, End Date, Project (auto-selected)
3. `handleCreateSprint()` validates dates (no past dates, end > start)
4. Calls `addSprint()` in AppContext → `POST /sprints` to backend
5. Optionally moves selected backlog tasks into the new sprint

**Sprint Lifecycle:**
- `planning` → `active` → `completed`
- Status transitions via dropdown on sprint header
- Active sprint highlighted in sprint selector

### 4.5 Create Task Flow

**Modal Fields:**
| Field | Type | Required |
|-------|------|----------|
| Title | Text input | ✅ |
| Description | Textarea | ❌ |
| Type | Select (epic/story/task/subtask/bug) | ✅ |
| Priority | Select (critical/high/medium/low) | ✅ |
| Status | Select | ✅ (default: open) |
| Project | Select | ✅ |
| Assignee | Select (from users) | ❌ |
| Reporter | Auto-set to current user | — |
| Sprint | Select | ❌ |
| Start Date | Date picker | ❌ |
| Due Date | Date picker | ❌ |
| Story Points | Number | ❌ |
| Tags | Multi-select | ❌ |

**API Flow:** `addTask()` → optimistic local insert → `POST /tasks` → replace temp ID with server ID or rollback on failure.

---

# Part 2 — Tasks, Calendar, Teams & Clients

---

## 5. My Tasks Module (`/tasks`)

**Route:** `/tasks`

### 5.1 Task Grid Overview

An advanced data grid (`TasksClient`) with features:
- **Column Management:** Reorder, resize, show/hide columns
- **Bulk Actions:** Multi-select tasks via checkboxes
- **Inline Creation:** Create tasks directly in the grid
- **Subtask Expansion:** Expand parent tasks to see children
- **Sorting:** Click column headers to sort

### 5.2 Available Columns

| Column | Description | Default Visible |
|--------|-------------|----------------|
| Checkbox | Multi-select | ✅ |
| Key | Task identifier (e.g., `PROJ-001`) | ✅ |
| Title | Task name (inline editable) | ✅ |
| Status | Dropdown badge | ✅ |
| Priority | Color-coded badge | ✅ |
| Assignee | Avatar + name | ✅ |
| Type | Icon + label | ✅ |
| Due Date | Date display | ✅ |
| Story Points | Numeric | ✅ |
| Tags | Tag badges | ❌ |
| Sprint | Sprint name badge | ❌ |

### 5.3 Bulk Actions

When tasks are selected, a floating action bar appears:
- **Change Status** → dropdown to set status for all selected tasks
- **Assign** → dropdown to assign all selected tasks to a user
- **Delete** → deletes all selected tasks (with confirmation)
- Selection count indicator

**API Flow:**
- `bulkUpdateTaskStatus(taskIds, status)` — loops through and updates each
- `bulkAssignTasks(taskIds, userId)` — assigns user to each task
- `bulkDeleteTasks(taskIds)` — removes each task

### 5.4 Inline Task Creation

1. Click "+ Add Task" row at the bottom of the grid
2. Type task title directly in the grid
3. Press Enter → `handleInlineCreate()` fires
4. Creates task with inherited defaults from context:
   - Project: current active project
   - Status: `open`
   - Priority: `medium`
   - Reporter: current user
5. For subtask creation: inherits parent's type and priority

### 5.5 Subtask Expansion

- Tasks with children show an expand/collapse chevron
- Clicking expands to show subtasks indented below parent
- Subtasks display with visual indentation and a connecting line indicator

### 5.6 Filtering & Search

- **Search:** Text input filters by task title
- **Status Filter:** Dropdown (All, Open, Assigned, In Progress, etc.)
- **Priority Filter:** Dropdown (All, Critical, High, Medium, Low)
- **Assignee Filter:** Dropdown (All Users, Unassigned, specific users)

---

## 6. Calendar Module (`/calendar`)

**Route:** `/calendar`

### 6.1 Calendar Views

Three view modes: **Month**, **Week**, **Day**

**Month View:**
- 7-column grid with day numbers
- Today highlighted with primary color circle
- Multi-day events rendered as horizontal bars spanning columns
- Event stacking with slot algorithm (prevents overlaps)
- Events color-coded by type

**Week View:**
- 7-column layout with day headers
- Events listed vertically within each day cell
- Min-height `400px` per day column

**Day View:**
- Single day detail with large date display
- Events listed as cards with left color border
- Empty state: Calendar icon + "No events scheduled"

### 6.2 Event Types & Colors

| Type | Color | Source |
|------|-------|--------|
| Regular Task | `#3B82F6` (blue) | Tasks with dates |
| Sprint | `#7B68EE` (purple) | Sprint date ranges |
| Milestone (Epic) | `#22C55E` (green) | Tasks of type `epic` |
| High Priority | `#F59E0B` (amber) | Tasks with `priority: high` |
| Critical | `#EF4444` (red) | Tasks with `priority: critical` |

### 6.3 Event Popover

Clicking an event opens a popover showing:
- Event type badge (colored)
- Date range (`start - end`)
- Title (bold)
- Description (if task has one)
- Project name with color dot

### 6.4 Creating Calendar Events

**"Create Event" Button** in sidebar opens modal:

| Field | Type | Notes |
|-------|------|-------|
| Event Type | Select | Task, Sprint, Milestone, High-Priority, Critical |
| Title | Text input | Required |
| Description | Textarea | Optional |
| Project | Select | Required; auto-selects current project |
| Due Date | Date input | For task types; past dates rejected |
| Start Date | Date input | For sprints |
| End Date | Date input | For sprints; defaults to start + 7 days |

**Type-Specific Behavior:**
- **Sprint:** Calls `addSprint()` with status `planning`
- **Milestone:** Creates task with type `epic`
- **High-Priority/Critical:** Creates task with respective priority
- **Task:** Creates standard task with `medium` priority

**Validation:** Past dates are rejected via `isPastDate()` check.

### 6.5 Sidebar Widgets

- **Quick Jump Mini-Calendar:** Compact month view; click a date to navigate
- **Upcoming Events:** Next 5 future events with colored dots and type badges
- **Event Types Legend:** Color-coded key for Tasks, Sprints, Milestones, High Priority, Critical

### 6.6 Navigation

- **←/→ arrows:** Navigate by month/week/day depending on view mode
- **"Today" button:** Returns to current date
- **Project Filter:** Dropdown to filter events by project (or "All Projects")

---

## 7. Teams Module (`/teams`)

**Route:** `/teams`

### 7.1 Page Layout

- Team selector tabs at top (one tab per team)
- Selected team's detail panel below
- **"+ Create Team" button** → opens team creation flow

### 7.2 Team Detail View

**Summary Cards (top row):**
| Card | Value Source |
|------|-------------|
| Velocity | Calculated from completed story points |
| Capacity | Team's configured capacity |
| Utilization | Tasks assigned vs capacity |
| Completion Rate | Closed tasks / total tasks percentage |

**Team Members Section:**
- Grid of member cards showing avatar, name, role
- Each member card has a context menu (⋮):
  - View Profile
  - Set as Team Lead
  - Remove from Team (`handleRemoveMember`)
- **"+ Add Member" button** → opens member selection modal

**Projects Section:**
- List of projects associated with the team
- Each project shows: key badge, name, progress bar, status badge

### 7.3 Team Creation Flow

1. Click "Create Team" button
2. Modal opens with fields:
   - **Name** (required)
   - **Description**
   - **Project Manager** (select from users, required)
   - **Team Lead** (select from users)
   - **Product Manager** (select from users)
   - **Capacity** (number, default 40)
   - **Projects** (multi-select)
   - **Members** (multi-select from users)
3. Submit → `addTeam()` → `POST /teams` with mapped payload
4. On success: team appears in tabs, toast notification

### 7.4 Add Member Flow

1. Click "Add Member" on team detail
2. Modal shows list of users NOT already on the team
3. Select user → `addTeamMember(teamId, userId)`
4. API: `POST /teams/{teamId}/members/{userId}`
5. Optimistic update: member added immediately; rolled back on API failure

### 7.5 Remove Member

- `removeTeamMember(teamId, userId)`
- API: `DELETE /teams/{teamId}/members/{userId}`
- Optimistic removal with rollback on failure
- Does NOT delete the user account

### 7.6 Create User (Inline)

Available from both Teams page and Add Member modal:
- Fields: Name, Email, Password, Role
- `addUser()` → `POST /users`
- Newly created user immediately available for team assignment

---

## 8. Client Management Module (`/clients`)

**Route:** `/clients`

### 8.1 View Modes

Two views toggled via icon buttons:
- **Grid View:** Card layout with client info, contact details, project count
- **Table View:** Data table with sortable columns

### 8.2 Client Card (Grid View)

Each card displays:
- Client name (bold heading)
- Type badge: `internal` or `external`
- Contact person name
- Email and phone
- Address
- Active projects count
- Total revenue
- Created date

### 8.3 Filtering

- **Search:** Text filter by client name or contact person
- **Type Filter:** All Types / Internal / External

### 8.4 Create/Edit Client

**"+ Add Client" button** opens dialog with fields:

| Field | Type | Required |
|-------|------|----------|
| Name | Text input | ✅ |
| Type | Select (internal/external) | ✅ |
| Contact Person | Text input | ❌ |
| Email | Email input | ❌ |
| Phone | Text input | ❌ |
| Address | Textarea | ❌ |

**Create Flow:**
1. Fill form → Click "Create"
2. `addClient()` → optimistic insert with temp ID
3. `POST /clients` → replace temp ID with server ID
4. Failure: rollback removal + error toast

**Edit Flow:**
1. Click ⋮ → "Edit" on client card/row
2. Dialog pre-populated with existing data
3. `updateClient(id, updates)` → optimistic update + `PATCH /clients/{id}`

**Delete Flow:**
- Click ⋮ → "Delete"
- `deleteClient(id)` → optimistic removal + `DELETE /clients/{id}`
- Rollback on failure

---

# Part 3 — Time Tracking, Resources, Programs, Invoices & Products

---

## 9. Time Tracking Module (`/timetracking`)

**Route:** `/timetracking`

### 9.1 Page Layout

- **Weekly Summary Card:** Total hours logged this week vs weekly goal (default 40h)
- **Progress bar** showing completion percentage
- **Time entries list** grouped by date

### 9.2 Logging Time

**"+ Log Time" button** opens modal:

| Field | Type | Notes |
|-------|------|-------|
| Task | Select | Required; dropdown of all tasks |
| Date | Date input | Required; defaults to today |
| Hours | Number input | Required; min 0.25, step 0.25 |
| Description | Textarea | Optional |

**API Flow:**
1. `addTimeEntry()` creates optimistic entry with temp ID
2. `POST /time-entries` with payload: `duration` (minutes), `date`, `description`, `task_id`, `user_id`
3. Backend returns saved entry → replaces temp ID via `mapBackendTimeEntry()`
4. Failure: removes optimistic entry + error toast

### 9.3 Time Entry Display

Each entry shows:
- Task name with project badge
- Date
- Duration in hours
- Description
- Edit/Delete action buttons

### 9.4 Edit/Delete Time Entry

- **Edit:** Opens modal pre-filled with entry data → `updateTimeEntry(id, updates)`
- **Delete:** Confirmation → `deleteTimeEntry(id)` removes from state

### 9.5 Utility Functions

- `getTaskTimeEntries(taskId)` — all entries for a specific task
- `getUserTimeEntries(userId, startDate?, endDate?)` — filtered by user and date range

---

## 10. Resource Management Module (`/resources`)

**Route:** `/resources`

### 10.1 Page Layout

- **Resource Overview Cards:** Total users, total allocations, average utilization
- **User Allocation Grid:** Each user row shows allocation per project

### 10.2 User Allocation Row

For each user:
- Avatar + name + role badge
- **Per-project allocation sliders** (0–100%)
- Total allocation percentage (sum of all project percentages)
- **Over-allocation warning:** Red badge when total > 100%

### 10.3 Managing Allocations

**Adding Allocation:**
- Select user → Select project → Set percentage (slider)
- `addResourceAllocation()` → creates with generated ID
- Validates total doesn't exceed capacity

**Updating Allocation:**
- Drag slider → `updateResourceAllocation(id, { percentage })` on release
- Real-time percentage display updates

**Removing Allocation:**
- Click X on allocation → `deleteResourceAllocation(id)`

### 10.4 Utility Functions

- `getUserAllocations(userId)` — all allocations for a user
- `getProjectAllocations(projectId)` — all allocations for a project

---

## 11. Programs Module (`/programs`)

**Route:** `/programs`

### 11.1 Page Layout

- Summary metrics bar (total programs, avg progress, total budget)
- Program cards in a responsive grid

### 11.2 Program Card

Each card displays:
- Program name + status badge (active/planning/on-hold/completed)
- Description
- **Progress bar** with percentage
- **Budget section:** Spent vs Total with utilization bar
- **Risk Level badge** (low/medium/high/critical)
- **AI Confidence** percentage badge
- Owner avatar + name
- Associated projects count

### 11.3 Create Program

**"+ Create Program" button** → modal fields:

| Field | Type | Notes |
|-------|------|-------|
| Name | Text | Required |
| Description | Textarea | Optional |
| Status | Select | planning/active/on-hold/completed |
| Risk Level | Select | low/medium/high/critical |
| Budget | Number | Currency amount |
| Spent | Number | Current expenditure |
| Progress | Number (0-100) | Percentage complete |
| AI Confidence | Number (0-100) | AI prediction confidence |
| Projects | Multi-select | Associate existing projects |
| Owner | Select (user) | Program owner |

**API:** `addProgram()` — local state only (no backend sync currently), generates `prog-{timestamp}` ID.

### 11.4 Edit/Delete Program

- **Edit:** Context menu → Edit → modal pre-filled → `updateProgram(id, updates)`
- **Delete:** Context menu → Delete → `deleteProgram(id)` removes from state

---

## 12. Invoices Module (`/invoices`)

**Route:** `/invoices`

### 12.1 Invoice Lifecycle

```
Draft → Sent → Paid
         ↘ Overdue
```

Status values: `draft` | `sent` | `paid` | `overdue` | `cancelled`

### 12.2 Page Layout

- **Summary Cards:**
  - Total Revenue (sum of paid invoices)
  - Outstanding (sum of sent/overdue invoices)
  - Overdue count
  - Draft count
- **Invoice list** with status tabs/filters

### 12.3 Invoice List View

Each invoice row shows:
- Invoice number (e.g., `INV-001`)
- Client name
- Issue date & due date
- Total amount (formatted currency)
- Status badge (color-coded)
- Actions: View, Edit, Send, Mark Paid, Delete

### 12.4 Create Invoice

**"+ New Invoice" button** → multi-step modal:

**Header Fields:**
| Field | Type |
|-------|------|
| Client | Select from clients list |
| Invoice Number | Auto-generated or manual |
| Issue Date | Date (defaults to today) |
| Due Date | Date (defaults to +30 days) |
| Payment Terms | Select (Net 15/30/45/60) |
| Notes | Textarea |

**Line Items Section:**
| Field | Type |
|-------|------|
| Product/Service | Select from Products catalog |
| Description | Text (auto-filled from product) |
| Quantity | Number |
| Unit Price | Currency (auto-filled from product) |
| Tax Rate | Percentage |
| Amount | Auto-calculated: `qty × price` |

**Dynamic Calculations:**
- Subtotal = sum of all line item amounts
- Tax = sum of `(lineAmount × taxRate / 100)`
- **Total = Subtotal + Tax**
- Recalculated on every field change

**Adding Line Items:**
- "Add Line" button appends a new empty row
- Product selection auto-fills description + unit price
- Remove line with X button

### 12.5 Invoice Actions

| Action | API | Status Change |
|--------|-----|---------------|
| Send | Updates status | draft → sent |
| Mark Paid | Updates status + payment date | sent/overdue → paid |
| Cancel | Updates status | any → cancelled |
| Delete | Removes invoice | — |
| Download PDF | Generates/downloads | — |

---

## 13. Products Module (`/products`)

**Route:** `/products`

### 13.1 Page Layout

- Summary cards: Total Products, Active Products, Categories count, Average Price
- Product grid with search and category filter

### 13.2 Product Card

Each product displays:
- Product name
- Category badge
- Description (truncated)
- Price (formatted currency)
- Active/Inactive status toggle
- SKU/Code identifier

### 13.3 Create Product

**"+ Add Product" button** → modal:

| Field | Type | Required |
|-------|------|----------|
| Name | Text | ✅ |
| Description | Textarea | ❌ |
| Category | Select/Input | ✅ |
| Price | Currency input | ✅ |
| SKU/Code | Text | ❌ |
| Active | Toggle switch | Default: true |

### 13.4 Product Actions

- **Edit:** Opens pre-filled modal → saves updates
- **Toggle Active Status:** Switch on/off (greyed out when inactive)
- **Delete:** Removes product from catalog

### 13.5 Filtering

- **Search:** By product name or description
- **Category Filter:** Dropdown showing all unique categories
- **Status Filter:** All / Active / Inactive

---

# Part 4 — Hierarchy, Portfolios, Reports, Settings & API Reference

---

## 14. Hierarchy Module (`/hierarchy`)

**Route:** `/hierarchy`

### 14.1 Purpose

Provides a **tree visualization** of the strategic hierarchy:

```
Portfolio → Program → Project
```

### 14.2 Page Layout

- **Header:** "Strategic Hierarchy" title + "New Portfolio" button
- **Summary Stats:** 4 cards showing Portfolios count, Programs count, Projects count, Total Budget
- **Legend:** Color-coded icons explaining Portfolio (purple), Program (accent), Project (blue)
- **Tree View:** Nested expandable cards

### 14.3 Portfolio Card (Top Level)

Each portfolio card contains:
- Expand/collapse chevron
- Portfolio icon + name + status badge
- **Stats row:** Progress %, Budget (spent/total), Owner name, Risk level
- **Budget utilization bar** (warns at >80%)
- **Nested Programs section** when expanded

### 14.4 Program Section (Mid Level)

When a portfolio is expanded, programs appear with:
- Tree connector lines (visual hierarchy)
- Expand/collapse toggle
- Program icon (Target) + name + status badge
- Stats: project count, budget spent/total
- Progress bar + AI confidence badge + risk badge
- Context menu: View Details, Edit, Add Project

### 14.5 Project Row (Leaf Level)

When a program is expanded, projects appear as:
- Tree connector lines
- Project icon (FolderKanban) + key badge + name + status badge
- Member avatars (max 3 + overflow count)
- Progress bar with percentage
- Risk level badge
- Context menu: View Project, Edit Project

### 14.6 Empty States

- No portfolios: Icon + "No portfolios yet" + "Create Portfolio" button
- No programs in portfolio: Dashed border + "Add Program" button
- No projects in program: Dashed border + "Add" button

---

## 15. Portfolios Module (`/portfolios`)

**Route:** `/portfolios`

### 15.1 Page Layout

- **Summary Cards:** Active Portfolios, Total Budget (+12% badge), Avg Progress, AI Confidence
- **Portfolio Cards Grid** (3 columns)
- **Selected Portfolio Detail** section below

### 15.2 Portfolio Card

Clickable card (selected state: primary ring outline) showing:
- Portfolio icon + name
- Program/project counts
- Description (2-line clamp)
- **Progress bar** with percentage
- **Budget utilization bar** (warns at >80%) with spent/budget values
- Owner avatar + name
- Risk level badge

### 15.3 Portfolio Detail (Tabs)

When a portfolio is selected, a detail card shows:
- Portfolio name + description
- AI Confidence badge

**Programs Tab:**
- Lists all programs in this portfolio
- Each: icon, name, risk badge, description, project count, budget, progress bar

**Projects Tab:**
- Grid of all projects across all programs
- Each: key badge, name, progress bar, risk badge

---

## 16. Reports & Analytics Module (`/reports`)

**Route:** `/reports`

### 16.1 Page Layout

- **Tab Bar:** Overview | Sprint Reports | Team Performance | Budget
- **Date Range Selector:** This Week / This Month / This Quarter / This Year
- **"AI Summary" button**

### 16.2 AI-Generated Insights Card

Gradient background card at top showing:
- AI sparkle icon
- Dynamic text summarizing project health and completed tasks
- "View detailed analysis" link
- "Generate executive report" link

### 16.3 Key Metrics Row (4 cards)

| Metric | Calculation |
|--------|-------------|
| Sprint Velocity | Sum of story points from closed tasks (`pts`) |
| Team Utilization | `(assigned tasks / total tasks) × 100` |
| Cycle Time | Placeholder (0 days) |
| AI Confidence | Static 65% when projects exist |

### 16.4 Charts

**Sprint Velocity (Bar Chart):**
- X-axis: Sprint names
- Two bars per sprint: Planned (grey) vs Completed (primary color)
- Data: story points per sprint calculated from tasks

**Sprint Burndown (Area Chart):**
- X-axis: Days
- Two areas: Ideal (dashed line) vs Remaining
- Currently empty data (placeholder)

**Task Distribution (Pie Chart):**
- Donut chart with status breakdown
- Colors: Completed (#22C55E), In Progress (#7B68EE), Open (#94A3B8), On Hold (#F59E0B)
- Legend below with counts

**Team Performance (Bar/Progress):**
- Per-user rows showing:
  - Avatar initials + name
  - Completed / capacity points
  - Efficiency badge (% of assigned tasks completed)
  - Progress bar

### 16.5 Generated Reports Section

- "Generate New Report" button
- Currently shows empty state: "No reports generated yet"

---

## 17. Settings Module (`/settings`)

**Route:** `/settings`

### 17.1 Tab Layout

4 tabs across full width: **Statuses** | **Tags** | **Types** | **Groups**

### 17.2 Statuses Tab

**Default Statuses:**
| Status | Color | Description |
|--------|-------|-------------|
| Open | #6B7280 | Task is newly created |
| Assigned | #3B82F6 | Task has been assigned |
| In Progress | #F59E0B | Work is ongoing |
| Pending Approval | #8B5CF6 | Awaiting review |
| On Hold | #EF4444 | Work paused |
| Closed | #22C55E | Task completed |

**Table Columns:** Drag handle, Name (with color dot), Color (hex badge), Description, Actions

**CRUD Operations:**
- **Add:** Modal with Name, Color picker + hex input, Description → `handleAddStatus()`
- **Edit:** Modal pre-filled → `handleUpdateStatus()`
- **Delete:** `handleDeleteStatus(id)` — immediate removal
- **Reorder:** Drag handles (visual only, no DnD implementation)

### 17.3 Tags Tab

Grid layout (3 columns) of tag cards.

**Default Tags:** Frontend (#7B68EE), Backend (#3B82F6), Design (#F59E0B), Bug (#EF4444), Feature (#22C55E), Documentation (#8B5CF6)

**CRUD:** Same modal pattern — Name + Color picker.

### 17.4 Types Tab

Table layout showing work item types.

**Default Types:** Epic (#8B5CF6), Story (#22C55E), Task (#3B82F6), Subtask (#6B7280), Bug (#EF4444)

**Table Columns:** Name, Color (dot + hex), Preview (colored badge), Actions

**CRUD:** Modal with Name + Color picker.

### 17.5 Groups Tab

Table layout for task groups.

**Default Groups:** Development, Design, QA, DevOps (each with description)

**CRUD:** Modal with Name + Description.

### 17.6 Settings State

All settings are managed in **local component state** (not persisted to backend). Changes reset on page reload.

---

## 18. Complete API Reference

### 18.1 Authentication Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/auth/login` | Login (OAuth2 `application/x-www-form-urlencoded`) |
| POST | `/auth/register` | Signup (JSON body) |

### 18.2 Entity CRUD Endpoints

| Entity | Create | Read | Update | Delete |
|--------|--------|------|--------|--------|
| Tasks | `POST /tasks` | `GET /tasks` | `PATCH /tasks/{id}` | `DELETE /tasks/{id}` |
| Projects | `POST /projects` | `GET /projects` | `PATCH /projects/{id}` | `DELETE /projects/{id}` |
| Teams | `POST /teams` | `GET /teams` | `PATCH /teams/{id}` | `DELETE /teams/{id}` |
| Clients | `POST /clients` | `GET /clients` | `PATCH /clients/{id}` | `DELETE /clients/{id}` |
| Users | `POST /users` | `GET /users` | — | — |
| Sprints | `POST /sprints` | `GET /sprints` | — | — |
| Time Entries | `POST /time-entries` | `GET /time-entries` | — | — |

### 18.3 Relationship Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/teams/{id}/members/{userId}` | Add member to team |
| DELETE | `/teams/{id}/members/{userId}` | Remove member from team |

### 18.4 API Communication Pattern

All API calls go through `fetchAPI()` in `lib/api.ts`:
1. Prepends base URL (`http://127.0.0.1:8100/api/v1`)
2. Injects `Authorization: Bearer {token}` header
3. Sets `Content-Type: application/json`
4. Parses JSON response
5. Throws on non-OK status

### 18.5 Data Mappers

Backend responses are normalized via mapper functions:
- `mapBackendTask()` — maps `due_date` → `dueDate`, `story_points` → `storyPoints`, status lowercase + hyphenation
- `mapBackendProject()` — maps `project_key` → `key`, `start_date`/`end_date` → camelCase
- `mapBackendTeam()` — resolves `member_ids` to user objects, maps role references
- `mapBackendClient()` — maps `contact_person` → `contactPerson`, `created_at` → `createdAt`
- `mapBackendSprint()` — maps `start_date`/`end_date`, `project_id` → `projectId`
- `mapBackendTimeEntry()` — converts `duration` (minutes) → `hours` (÷ 60)

---

## 19. Cross-Cutting Concerns

### 19.1 Toast Notifications

All actions trigger toasts via `showToast()`:
- **Success:** Green — "Task created", "Project updated", etc.
- **Error:** Red — "Creation failed", "Update failed" with error message
- **Info:** Blue — "Feature coming soon", placeholder actions

Auto-dismiss after timeout. Dismissible via `dismissToast(id)`.

### 19.2 Modal System

Centralized via `openModal(type, data?)` / `closeModal()`:

| Modal Type | Trigger |
|------------|---------|
| `create-task` | Header Create menu, Kanban + button, Tasks inline |
| `create-project` | Header Create, Sidebar, Hierarchy |
| `create-sprint` | Header Create, Backlog view, Calendar |
| `create-team` | Teams page |
| `create-program` | Programs page, Hierarchy |
| `create-portfolio` | Hierarchy page, Portfolios page |
| `user-profile` | Header avatar dropdown |

### 19.3 Optimistic UI Pattern

```
1. Generate temp ID: `{entity}-temp-{timestamp}`
2. Insert into local state immediately
3. Call API endpoint
4. On success: Replace temp ID with server ID via mapper
5. On failure: Remove optimistic entry + show error toast
```

### 19.4 Responsive Design

- Sidebar: Collapsible (`w-64` → `w-[72px]`) with tooltips in collapsed state
- Grids: Breakpoints at `sm`, `md`, `lg`, `xl` for column adjustments
- Hidden elements: Team stats, project members hidden on smaller screens via `hidden sm:flex`

---

*End of Documentation*

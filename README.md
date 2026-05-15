# Motion API Explorer

An interactive tool for exploring and managing [Motion](https://www.usemotion.com/) projects, tasks, and stages via the Motion API. Includes a raw API endpoint tester and a visual project dashboard with a Gantt-style editor.

## Features

### API Explorer (`/`)
- Browse all Motion API endpoints organized by category (Tasks, Projects, Schedules, Users, etc.)
- Execute requests with live responses
- Request preview and cURL export
- Supports both GET and POST/PATCH/DELETE methods with JSON body editor

### Project Dashboard (`/dashboard.html`)
- **Browse Projects** — lists all projects organized by workspace and folder
- **Project Detail** — stage breakdown, timeline summary, and task list per project
- **Gantt View** — drag-and-drop Gantt chart for tasks and stages with a commit workflow
- **Search** — search tasks by name across all projects
- **Metadata** — explore raw workspace, user, and schedule data

#### Gantt Editing
Tasks and stages can be repositioned by dragging. Changes accumulate in a pending queue and are only committed to the API when you click **Commit Changes**.

**Task move behavior:**
- Auto-scheduled tasks: disables Motion's AI scheduler and pins to the new dates
- Manually pinned tasks: shifts `scheduledStart`/`scheduledEnd`
- Unscheduled tasks (no scheduled dates): shifts `dueDate`

**Stage move behavior:**
- Moving a stage right extends it and cascades all subsequent stages right by the same delta
- Moving a stage left contracts it; subsequent stages move left by the same delta
- Stage positions are based on sequential `dueDate` values — a stage's visual start is the previous stage's `dueDate`
- Commits are applied in stage order (earliest to latest) to maintain sequential consistency

## Prerequisites

- [Node.js](https://nodejs.org/) v16+
- A Motion API key (available from your Motion account settings)

## Setup

```bash
git clone https://github.com/ming-spacial/motion-explorer.git
cd motion-explorer
npm install
npm start
```

Open [http://localhost:3737](http://localhost:3737) in your browser.

Enter your Motion API key in the key field at the top of either page. The key is stored in `sessionStorage` and never sent anywhere except to the Motion API via the local proxy.

## Architecture

```
browser  →  localhost:3737  →  Express proxy  →  api.usemotion.com   (v1 endpoints)
                                               →  internal.usemotion.com  (v2 endpoints)
```

The Express server in `server.js` acts as a CORS proxy. All requests from the browser go to `/proxy/<path>`, which strips the prefix and forwards to the appropriate Motion API host:

- Paths starting with `/v2/` → `internal.usemotion.com`
- All other paths → `api.usemotion.com`

The API key is passed via the `X-API-Key` header and forwarded to Motion on every request.

## API Notes

Motion exposes two API surfaces used by this tool:

| Version | Host | Used for |
|---------|------|----------|
| v1 | `api.usemotion.com` | Projects list, tasks, schedules, users |
| v2 | `internal.usemotion.com` | Folder resolution, per-project detail, stage updates |

**Folder resolution** requires three sequential calls: `GET /v2/folders` for the folder map, `GET /v1/projects` for the project list, then parallel `GET /v2/projects/{id}` calls to retrieve each project's `folderId`.

**Stage dates**: Stage duration (in minutes) represents total task effort, not calendar span. The visual bar for a stage spans from the previous stage's `dueDate` to the current stage's `dueDate`. Only `dueDate` is writable via `PATCH /v2/projects/{id}/stages/{stageDefinitionId}`.

## Project Structure

```
motion-explorer/
├── server.js           # Express proxy server
├── package.json
├── public/
│   ├── index.html      # Raw API Explorer UI
│   └── dashboard.html  # Project dashboard and Gantt editor
└── .gitignore
```

## License

MIT

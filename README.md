# 🧩 Pipeline Editor (DAG Builder)

An interactive, React-based pipeline editor for creating and managing **Directed Acyclic Graphs (DAGs)**. Ideal for visualizing ETL pipelines, data workflows, and complex processing chains.

![React](https://img.shields.io/badge/React-18.x-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 🚀 Features

### ⚙️ Core Functionality
- **Visual Node Creation**: Add nodes with names and auto-type assignment
- **Interactive Edge Drawing**: Connect nodes with directional arrows
- **Drag & Drop Interface**: Smooth node positioning
- **Real-time DAG Validation**: Cycle detection and detailed error messages
- **Smart Connection Rules**: Prevents invalid edges
- **Keyboard Controls**: Delete, Backspace, and ESC support

### 🔧 Advanced Features
- **Auto Layout Engine**: Topological sorting for intelligent node arrangement
- **Live JSON Preview**: See the pipeline structure in real-time
- **Node Types**: Color-coded nodes — Source, Transform, Sink
- **Visual Feedback**: Hover states, highlights, connection cues

### 🧑‍💻 User Experience
- **Clean UI**: Minimal, modern design
- **Responsive Layout**: Works on all screen sizes
- **Accessible**: Semantic HTML and contrast-aware styling
- **Performance**: Optimized for large DAGs

---

## 🎯 Demo

![Pipeline Editor Interface](screenshot-placeholder.png)

Try it now:  
→ **Add Node** → Connect → Auto Layout → Preview JSON

---

## 🛠️ Tech Stack

- **Framework**: React 18+ (TypeScript)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Graphics**: SVG for edges/arrows
- **State**: React Hooks (`useState`, `useRef`, `useCallback`)
- **Validation**: Custom DAG validator with cycle detection

---

## 📦 Installation

### Prerequisites
- Node.js 16+
- npm or yarn

### Quick Start

```bash
# Clone repo
git clone https://github.com/yourusername/pipeline-editor.git
cd pipeline-editor

# Install
npm install    # or yarn install

# Run dev server
npm start      # or yarn start

# Open http://localhost:3000

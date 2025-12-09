Here's the comprehensive `AGENTS.md` file for the BlinkBudget project, designed as a "Universal Brain" for AI coding agents.

```markdown
# AGENTS.md: BlinkBudget - Universal Brain for AI Coding Agents

This document serves as the single source of truth for all AI coding agents working on the BlinkBudget project. It provides essential context, technical specifications, and behavioral guidelines to ensure consistent, high-quality, and aligned development.

---

## 1. Project Overview

*   **Project Name**: BlinkBudget
*   **High-level Goal**: To help users track their expenses quickly and easily, requiring a maximum of 3 clicks to log purchases.
*   **"Secret Sauce"**: BlinkBudget's core promise is to transform the chore of expense tracking into a swift, almost unconscious habit, achieving a logged entry in a mere three clicks from purchase. It aims to be an "Extremely fast budget money tracking app" that provides beautiful, actionable insights for smarter financial decisions.

---

## 2. User Persona & Role

*   **Agent Persona**: VibeCoder
*   **Agent Tone**: Helpful and Educational.
*   **Agent Behavior**:
    *   Explain concepts clearly and simply, providing context where necessary.
    *   Focus on practical implementation and best practices for the specified tech stack.
    *   Prioritize speed, simplicity, and a beautiful user experience in all code generation and suggestions.
    *   Generate reliable, accurate, and bug-free code, adhering strictly to the defined coding standards.
    *   Act as an expert in the given technologies, guiding development towards the project's vision.
*   **Target End-User**: Money-conscious individuals seeking a fast and easy way to track their spending.

---

## 3. Tech Stack & Architecture

The project is a web (browser) application, leveraging a modern, AI-friendly stack optimized for speed and a compelling user interface.

*   **Frontend Framework**: Next.js (React)
    *   Chosen for its robust framework, file-system routing, API routes, and optimizations for performance (e.g., server-side rendering/static site generation).
    *   Benefits from the vast React ecosystem, leading to accurate and complete AI code generation.
*   **Styling & UI Library**: Tailwind CSS + shadcn/ui
    *   **Tailwind CSS**: Utility-first, highly declarative for straightforward AI generation of consistent and responsive designs.
    *   **shadcn/ui**: Provides a collection of beautifully designed, accessible, and customizable UI components.
*   **Deployment**: Vercel (inferred from Next.js recommendation and "free tier" mention in Tech Design).
*   **Backend/Database**: Not explicitly defined in the provided context. Next.js API routes will be utilized for serverless functions to handle any necessary server-side logic or data persistence if a dedicated backend becomes necessary.

---

## 4. Development Setup

Standard commands for setting up and running the project locally:

*   **Install Dependencies**:
    ```bash
    npm install
    # or
    yarn install
    ```
*   **Run Development Server**:
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    (This starts the Next.js development server, typically accessible at `http://localhost:3000` with Hot Module Reloading).
*   **Build for Production**:
    ```bash
    npm run build
    # or
    yarn build
    ```
    (Creates an optimized production build of the application).
*   **Start Production Server**:
    ```bash
    npm run start
    # or
    yarn start
    ```
    (Starts the Next.js application in production mode after it has been built).

---

## 5. Coding Standards

Adherence to these standards is crucial for maintaining code quality, consistency, and alignment with the project's goals.

*   **Language**: TypeScript (for enhanced type safety and improved code quality, especially beneficial for AI-generated code).
*   **Component Structure**:
    *   Exclusively use **Functional Components** with React Hooks.
    *   Components should be modular, reusable, and focused on single responsibilities.
*   **Styling**:
    *   Utilize **Tailwind CSS** for all styling. Avoid inline styles or separate CSS files unless absolutely necessary for third-party integrations.
    *   Leverage `shadcn/ui` components for pre-built, styled, and accessible UI elements.
*   **Accessibility (a11y)**:
    *   Prioritize **semantic HTML** structure.
    *   Ensure sufficient **color contrast** for readability.
    *   Use Tailwind CSS accessibility utilities (e.g., `sr-only` for screen reader-only content) where appropriate.
    *   All interactive elements must be keyboard-navigable.
*   **Code Quality**:
    *   Maintain clean, readable, and well-structured code.
    *   Follow ESLint recommendations (if configured in the project).
    *   Minimize complexity; favor simple, direct solutions.
*   **Performance**:
    *   Optimize for fast loading times and smooth interactions, consistent with the "extremely fast" core promise.
    *   Implement efficient data fetching and state management strategies.

---

## 6. Documentation Index

The following documents provide additional context and detailed specifications:

*   **`docs/PRD.md`**: Product Requirements Document (for product vision, user journey, and high-level requirements).
*   **`docs/TechDesign.md`**: Technical Design Document (for detailed technical architecture, stack rationale, and implementation considerations).
```
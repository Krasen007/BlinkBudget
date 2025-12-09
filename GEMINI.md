# GEMINI.MD: AI Collaboration Guide

This document provides essential context for AI models interacting with this project. Adhering to these guidelines will ensure consistency and maintain code quality.

## 1. Project Overview & Purpose

* **Primary Goal:** Help track your expenses, it is quick and easy to use, fast, 3 clicks max to track your purchases.
* **Business Domain:** Money conscious individuals

## 2. Core Technologies & Stack

* **Stack:** Web (browser)

## 3. Architectural Patterns

* **Overall Architecture:** Modular Monolith (Default)
* **Directory Structure Philosophy:** (Inferred)
    * `/src`: Contains all primary source code.
    * `/tests`: Contains all unit and integration tests.
    * `/config`: Holds environment and configuration files.

## 4. Coding Conventions & Style Guide

* **Formatting:** Standard formatting (e.g. Prettier/Black).
* **Naming Conventions:** CamelCase for vars/funcs, PascalCase for classes/components.
* **API Design:** RESTful principles (unless otherwise specified).
* **Error Handling:** Use try...catch blocks and custom error classes.

## 5. Key Files & Entrypoints

* **Main Entrypoint(s):** (Inferred from stack, e.g., index.js, app.py)
* **Configuration:** .env, config files.
* **CI/CD Pipeline:** GitHub Actions (inferred).

## 6. Development & Testing Workflow

* **Local Development Environment:**
# Bash commands
- npm install: Install dependencies
- npm run dev: Start development server
- npm run build: Build for production
- npm test: Run test suite

* **Testing:**
    * Run tests via standard commands.
    * New code requires corresponding unit tests.

## 7. Specific Instructions for AI Collaboration

* **Contribution Guidelines:** All changes must review AGENTS.md.
* **Security:** Do not hardcode secrets. Ensure auth logic is secure.
* **Dependencies:** Use standard package managers (npm/pip) to add libs.

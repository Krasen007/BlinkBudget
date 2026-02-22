# ExpandableSection Component

## Overview

The ExpandableSection component creates a collapsible section with a title and expandable content area. It supports state persistence via localStorage, smooth animations, and full accessibility compliance.

## Component Information

- File: src/components/ExpandableSection.js
- Feature: Feature 3.5.2 - Progressive Disclosure Interface

## Features

### Core Functionality

- Toggle expand/collapse with smooth CSS transitions
- State persistence in localStorage
- Custom icon support
- Programmatic expand/collapse

### Accessibility

- Semantic button element for toggle
- ARIA attributes (aria-expanded, aria-label)
- Keyboard support (Enter, Space)
- Focus styles for keyboard navigation

### Mobile Support

- Touch event handling
- Scale feedback on touch
- Minimum touch target sizes

## Usage

### Basic Usage

const section = ExpandableSection({
title: "Transaction Details",
defaultExpanded: false
});

### With Options

const section = ExpandableSection({
title: "Advanced Options",
storageKey: "advanced-options-expanded",
icon: "Gear"
});

## API

### Component Options

| Property        | Type        | Default  | Description                      |
| --------------- | ----------- | -------- | -------------------------------- |
| title           | string      | Required | Section title text               |
| content         | HTMLElement | null     | Initial content element          |
| defaultExpanded | boolean     | false    | Initial expanded state           |
| storageKey      | string      | null     | localStorage key for persistence |
| icon            | string      | null     | Icon to display before title     |

### Return Object

| Method              | Description           |
| ------------------- | --------------------- |
| expand()            | Expand the section    |
| collapse()          | Collapse the section  |
| toggle()            | Toggle expanded state |
| isExpanded()        | Get current state     |
| setContent(element) | Replace content       |
| getExpandedState()  | Get current state     |

### Properties

| Property  | Type        |
| --------- | ----------- |
| container | HTMLElement |
| toggle    | HTMLElement |
| content   | HTMLElement |

## Accessibility

- ARIA attributes (aria-expanded, aria-label)
- Keyboard navigation (Enter, Space)
- Focus styles
- Screen reader support

---

_Template Version: 1.0_
_Last Updated: February 22, 2026_

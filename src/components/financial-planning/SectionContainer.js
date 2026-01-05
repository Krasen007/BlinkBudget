import { COLORS, SPACING } from '../../utils/constants.js';

/**
 * SectionContainer Component - Wrapper for financial planning sections
 * @param {Object} props - Section properties
 * @param {string} props.id - Section ID
 * @param {string} props.title - Section title
 * @param {string} props.icon - Section icon emoji
 * @param {string} [props.usageNote] - Optional usage note text
 * @returns {HTMLElement} The section container element
 */
export const SectionContainer = ({ id, title, icon, usageNote }) => {
  const section = document.createElement('section');
  section.className = `financial-planning-section ${id}-section`;
  section.style.display = 'flex';
  section.style.flexDirection = 'column';
  section.style.gap = SPACING.LG;

  const header = document.createElement('div');
  header.className = 'section-header';
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.gap = SPACING.MD;
  const headerTitle = document.createElement('h2');
  headerTitle.textContent = `${icon} ${title}`;
  headerTitle.style.margin = '0';
  headerTitle.style.fontSize = '1.5rem';
  headerTitle.style.fontWeight = '600';
  headerTitle.style.color = COLORS.TEXT_MAIN;

  header.appendChild(headerTitle);
  section.appendChild(header);

  // Add usage note if provided
  if (usageNote) {
    const note = document.createElement('div');
    note.className = 'section-usage-note';
    note.style.fontSize = '0.95rem';
    note.style.color = COLORS.TEXT_MUTED;
    note.style.lineHeight = '1.4';
    note.textContent = usageNote;
    section.appendChild(note);
  }
  return section;
};

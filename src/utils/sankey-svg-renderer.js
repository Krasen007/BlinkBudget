/**
 * Sankey SVG Renderer
 *
 * Builds the SVG element tree for the Cash Flow Sankey diagram.
 */

import { formatCurrency } from './financial-planning-helpers.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

export function createSvg(tag, attrs = {}, text = '') {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  if (text) el.textContent = text;
  return el;
}

/**
 * Render the complete Sankey SVG element.
 * @param {Object} options
 * @returns {SVGElement}
 */
export function renderSankeySvg({
  layout,
  flowData,
  onHoverRibbon,
  onLeaveRibbon,
  onHoverNode,
  onLeaveNode,
  onMouseMove,
}) {
  const svg = createSvg('svg', {
    class: 'sankey-svg',
    viewBox: `0 0 ${layout.width} ${layout.height}`,
    role: 'img',
    'aria-label': `Cash flow Sankey diagram for ${flowData.periodLabel}`,
  });

  // Ribbons Group (flat category colors, matching other charts)
  const allRibbons = [...layout.inRibbons, ...layout.outRibbons];
  const ribbonsGroup = createSvg('g', { class: 'sankey-ribbons' });

  allRibbons.forEach(r => {
    const path = createSvg('path', {
      d: r.pathData,
      fill: r.color,
      class: 'sankey-ribbon',
      'data-ribbon-id': r.id,
      'data-source-id': r.sourceId,
      'data-target-id': r.targetId,
    });

    const desc = `${r.sourceName} → ${r.targetName}: ${formatCurrency(r.amount)} (${r.percent.toFixed(1)}%)`;
    path.appendChild(createSvg('title', {}, desc));

    path.addEventListener('mouseenter', e => onHoverRibbon(e, r));
    path.addEventListener('mousemove', onMouseMove);
    path.addEventListener('mouseleave', onLeaveRibbon);

    ribbonsGroup.appendChild(path);
  });
  svg.appendChild(ribbonsGroup);

  // Nodes Group
  const nodesGroup = createSvg('g', { class: 'sankey-nodes' });

  const addNode = (node, id, name, amount, percent) => {
    const g = createSvg('g', {
      class: 'sankey-node',
      'data-node-id': id,
      tabindex: '0',
      role: 'img',
      'aria-label': `${name}, ${percent.toFixed(1)}% of cash flow`,
    });
    const rx = Math.min(3, Math.max(1, node.height / 2));
    g.appendChild(
      createSvg('rect', {
        x: node.x,
        y: node.y,
        width: node.width,
        height: Math.max(node.height, 2),
        rx: String(rx),
        fill: node.color,
        class: 'sankey-node-bar',
      })
    );
    g.addEventListener('mouseenter', e =>
      onHoverNode(e, id, name, amount, percent)
    );
    g.addEventListener('mousemove', onMouseMove);
    g.addEventListener('mouseleave', onLeaveNode);
    g.addEventListener('focus', () => {
      const bounds = g.getBoundingClientRect();
      onHoverNode(
        {
          clientX: bounds.left + bounds.width / 2,
          clientY: bounds.top + bounds.height / 2,
        },
        id,
        name,
        amount,
        percent
      );
    });
    g.addEventListener('blur', onLeaveNode);
    nodesGroup.appendChild(g);
  };

  layout.leftNodes.forEach(node =>
    addNode(node, node.id, node.name, node.amount, node.percent)
  );

  addNode(
    layout.centerBar,
    'center-node',
    'Cash Flow',
    layout.centerBar.amount,
    100
  );

  layout.rightNodes.forEach(node =>
    addNode(node, node.id, node.name, node.amount, node.percent)
  );
  svg.appendChild(nodesGroup);

  // Labels Group
  const labelsGroup = createSvg('g', { class: 'sankey-labels' });

  // Left Labels
  layout.leftNodes.forEach(node => {
    const textX = node.x + node.width + 8;
    const text = createSvg('text', {
      x: textX,
      y: node.centerY,
      'text-anchor': 'start',
    });
    const displayName =
      node.name.length > 20 ? `${node.name.slice(0, 18)}…` : node.name;
    text.appendChild(
      createSvg(
        'tspan',
        { x: textX, dy: '-2', class: 'sankey-label-name' },
        displayName
      )
    );
    text.appendChild(
      createSvg(
        'tspan',
        { x: textX, dy: '13', class: 'sankey-label-amount' },
        formatCurrency(node.amount)
      )
    );
    labelsGroup.appendChild(text);
  });

  // Center Label
  const cTextX = layout.centerBar.x + layout.centerBar.width + 8;
  const cText = createSvg('text', {
    x: cTextX,
    y: layout.centerBar.y + layout.centerBar.height / 2,
    'text-anchor': 'start',
  });
  cText.appendChild(
    createSvg(
      'tspan',
      { x: cTextX, dy: '-2', class: 'sankey-center-name' },
      'Cash Flow'
    )
  );
  cText.appendChild(
    createSvg(
      'tspan',
      { x: cTextX, dy: '14', class: 'sankey-center-amount' },
      formatCurrency(layout.centerBar.amount)
    )
  );
  labelsGroup.appendChild(cText);

  // Right Labels
  layout.rightNodes.forEach(node => {
    const textX = node.x - 8;
    const text = createSvg('text', {
      x: textX,
      y: node.centerY,
      'text-anchor': 'end',
    });
    const displayName =
      node.name.length > 20 ? `${node.name.slice(0, 18)}…` : node.name;
    text.appendChild(
      createSvg(
        'tspan',
        { x: textX, dy: '-2', class: 'sankey-label-name' },
        displayName
      )
    );
    text.appendChild(
      createSvg(
        'tspan',
        { x: textX, dy: '13', class: 'sankey-label-amount' },
        formatCurrency(node.amount)
      )
    );
    labelsGroup.appendChild(text);
  });
  svg.appendChild(labelsGroup);

  return svg;
}

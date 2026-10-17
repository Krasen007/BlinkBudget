// tests/components/custom-category-manager-drag.test.js
// Regression coverage for drag-to-reorder in CustomCategoryManager (todo.md
// "manual reorder... should be possible to use drag"). jsdom has no DragEvent
// constructor, so native drag events are dispatched as plain Events with a
// stubbed dataTransfer, mirroring what the component actually touches.
import { describe, it, expect, beforeEach, vi } from 'vitest';

const { state } = vi.hoisted(() => ({
  state: {
    categories: [
      {
        id: 'cat-1',
        name: 'Food',
        type: 'expense',
        color: '#111111',
        sortOrder: 0,
      },
      {
        id: 'cat-2',
        name: 'Transport',
        type: 'expense',
        color: '#222222',
        sortOrder: 1,
      },
      {
        id: 'cat-3',
        name: 'Fun',
        type: 'expense',
        color: '#333333',
        sortOrder: 2,
      },
    ],
  },
}));

vi.mock('../../src/core/custom-category-service.js', () => ({
  CustomCategoryService: {
    getByType: vi.fn(() => state.categories),
    reorder: vi.fn(ids => {
      const byId = new Map(state.categories.map(c => [c.id, c]));
      state.categories = ids.map(id => byId.get(id));
      return true;
    }),
  },
}));

vi.mock('../../src/core/router.js', () => ({
  Router: { navigate: vi.fn() },
}));

import { CustomCategoryManager } from '../../src/components/CustomCategoryManager.js';
import { CustomCategoryService } from '../../src/core/custom-category-service.js';

const createDataTransfer = () => {
  const data = new Map();
  return {
    effectAllowed: '',
    dropEffect: '',
    setData: vi.fn((type, value) => data.set(type, value)),
    getData: vi.fn(type => data.get(type)),
    setDragImage: vi.fn(),
  };
};

const dispatchDrag = (el, type, dataTransfer) => {
  const event = new Event(type, { bubbles: true, cancelable: true });
  event.dataTransfer = dataTransfer;
  el.dispatchEvent(event);
  return event;
};

const cardIdsIn = manager =>
  [...manager.querySelectorAll('.category-card')].map(card =>
    card.getAttribute('data-category-id')
  );

const seedCategories = () => {
  state.categories = [
    {
      id: 'cat-1',
      name: 'Food',
      type: 'expense',
      color: '#111111',
      sortOrder: 0,
    },
    {
      id: 'cat-2',
      name: 'Transport',
      type: 'expense',
      color: '#222222',
      sortOrder: 1,
    },
    {
      id: 'cat-3',
      name: 'Fun',
      type: 'expense',
      color: '#333333',
      sortOrder: 2,
    },
  ];
};

describe('CustomCategoryManager - drag to reorder', () => {
  let onCategoryChange;

  beforeEach(() => {
    vi.clearAllMocks();
    seedCategories();
    onCategoryChange = vi.fn();
  });

  it('renders a draggable drag handle on every card', () => {
    const manager = CustomCategoryManager({ onCategoryChange });
    const handles = manager.querySelectorAll('.category-drag-handle');

    expect(handles).toHaveLength(3);
    handles.forEach(handle => expect(handle.draggable).toBe(true));
  });

  it('marks the card as dragging and records the id on dragstart', () => {
    const manager = CustomCategoryManager({ onCategoryChange });
    const [firstCard] = manager.querySelectorAll('.category-card');
    const handle = firstCard.querySelector('.category-drag-handle');
    const dataTransfer = createDataTransfer();

    dispatchDrag(handle, 'dragstart', dataTransfer);

    expect(firstCard.classList.contains('category-card--dragging')).toBe(true);
    expect(dataTransfer.setData).toHaveBeenCalledWith('text/plain', 'cat-1');
    expect(dataTransfer.setDragImage).toHaveBeenCalled();
  });

  it('highlights a card as drop target on dragover and allows the drop', () => {
    const manager = CustomCategoryManager({ onCategoryChange });
    const [, , thirdCard] = manager.querySelectorAll('.category-card');
    const firstHandle = manager.querySelector('.category-drag-handle');
    const dataTransfer = createDataTransfer();

    dispatchDrag(firstHandle, 'dragstart', dataTransfer);
    const overEvent = dispatchDrag(thirdCard, 'dragover', dataTransfer);

    expect(thirdCard.classList.contains('category-card--drop-target')).toBe(
      true
    );
    // The drop handler relies on preventDefault in dragover to ever fire
    expect(overEvent.defaultPrevented).toBe(true);
    expect(dataTransfer.dropEffect).toBe('move');
  });

  it('persists the new order when a card is dropped onto another', () => {
    const manager = CustomCategoryManager({ onCategoryChange });
    const [firstCard, , thirdCard] = manager.querySelectorAll('.category-card');
    const handle = firstCard.querySelector('.category-drag-handle');
    const dataTransfer = createDataTransfer();

    dispatchDrag(handle, 'dragstart', dataTransfer);
    dispatchDrag(thirdCard, 'drop', dataTransfer);

    // cat-1 takes cat-3's slot; the rest keep their relative order
    expect(CustomCategoryService.reorder).toHaveBeenCalledWith([
      'cat-2',
      'cat-3',
      'cat-1',
    ]);
    expect(cardIdsIn(manager)).toEqual(['cat-2', 'cat-3', 'cat-1']);
    expect(onCategoryChange).toHaveBeenCalledTimes(1);
  });

  it('does not reorder when a card is dropped onto itself', () => {
    const manager = CustomCategoryManager({ onCategoryChange });
    const [firstCard] = manager.querySelectorAll('.category-card');
    const handle = firstCard.querySelector('.category-drag-handle');
    const dataTransfer = createDataTransfer();

    dispatchDrag(handle, 'dragstart', dataTransfer);
    dispatchDrag(firstCard, 'drop', dataTransfer);

    expect(CustomCategoryService.reorder).not.toHaveBeenCalled();
    expect(cardIdsIn(manager)).toEqual(['cat-1', 'cat-2', 'cat-3']);
  });

  it('ignores dragover from other sources (e.g. text dragged into the list)', () => {
    const manager = CustomCategoryManager({ onCategoryChange });
    const [, secondCard] = manager.querySelectorAll('.category-card');

    dispatchDrag(secondCard, 'dragover', createDataTransfer());

    expect(secondCard.classList.contains('category-card--drop-target')).toBe(
      false
    );
  });

  it('cleans up dragging and drop-target state on dragend', () => {
    const manager = CustomCategoryManager({ onCategoryChange });
    const [firstCard, , thirdCard] = manager.querySelectorAll('.category-card');
    const handle = firstCard.querySelector('.category-drag-handle');
    const dataTransfer = createDataTransfer();

    dispatchDrag(handle, 'dragstart', dataTransfer);
    dispatchDrag(thirdCard, 'dragover', dataTransfer);
    dispatchDrag(handle, 'dragend', dataTransfer);

    expect(firstCard.classList.contains('category-card--dragging')).toBe(false);
    expect(thirdCard.classList.contains('category-card--drop-target')).toBe(
      false
    );
    expect(CustomCategoryService.reorder).not.toHaveBeenCalled();
  });

  it('keeps the arrow buttons working alongside drag', () => {
    const manager = CustomCategoryManager({ onCategoryChange });
    const downButton = manager.querySelector(
      '.category-card[data-category-id="cat-1"] button[aria-label="Move category down"]'
    );

    downButton.click();

    expect(CustomCategoryService.reorder).toHaveBeenCalledWith([
      'cat-2',
      'cat-1',
      'cat-3',
    ]);
  });
});

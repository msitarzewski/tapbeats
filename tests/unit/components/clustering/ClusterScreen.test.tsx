import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { useClusterStore } from '@/state/clusterStore';
import { useRecordingStore } from '@/state/recordingStore';
import type { ClusterData } from '@/types/clustering';

// Mock canvas since jsdom doesn't support it
beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
    arc: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    translate: vi.fn(),
    setTransform: vi.fn(),
    canvas: { width: 300, height: 150 },
    lineWidth: 1,
    strokeStyle: '',
    fillStyle: '',
    globalAlpha: 1,
    lineCap: 'butt',
  })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
});

// Mock useClusterPlayback hook
vi.mock('@/hooks/useClusterPlayback', () => ({
  useClusterPlayback: () => ({
    playingClusterId: null,
    play: vi.fn(),
    stop: vi.fn(),
  }),
}));

// Mock useClusterWaveformRenderer hook
vi.mock('@/hooks/useClusterWaveformRenderer', () => ({
  useClusterWaveformRenderer: vi.fn(),
}));

// Lazy import after mocks are set up
const { ClusterScreen } = await import('@/components/clustering/ClusterScreen');

function makeCluster(id: number, hitCount: number): ClusterData {
  return {
    id,
    hitIndices: Array.from({ length: hitCount }, (_, i) => id * 10 + i),
    centroid: new Array<number>(12).fill(0),
    hitCount,
    representativeHitIndex: id * 10,
    color: `var(--cluster-${String(id % 8)})`,
  };
}

function setClusterState(clusters: ClusterData[]) {
  const assignments: number[] = [];
  const featureVectors: number[][] = [];
  for (const c of clusters) {
    assignments.push(...c.hitIndices.map(() => c.id));
    featureVectors.push(...c.hitIndices.map(() => new Array<number>(12).fill(0)));
  }

  useClusterStore.setState({
    status: 'ready',
    clusters,
    assignments,
    featureVectors,
    silhouette: 0.8,
    error: null,
  });
}

describe('ClusterScreen', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    useClusterStore.getState().reset();
    useRecordingStore.getState().reset();
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('renders cluster count in summary text', () => {
    setClusterState([makeCluster(0, 5), makeCluster(1, 3)]);

    act(() => {
      createRoot(container).render(
        <MemoryRouter>
          <ClusterScreen />
        </MemoryRouter>,
      );
    });

    expect(container.textContent).toContain('2');
    expect(container.textContent).toContain('sounds');
  });

  it('renders correct number of cluster cards', () => {
    setClusterState([makeCluster(0, 5), makeCluster(1, 3), makeCluster(2, 4)]);

    act(() => {
      createRoot(container).render(
        <MemoryRouter>
          <ClusterScreen />
        </MemoryRouter>,
      );
    });

    const listItems = container.querySelectorAll('[role="listitem"]');
    expect(listItems.length).toBe(3);
  });

  it('shows singular "sound" for single cluster', () => {
    setClusterState([makeCluster(0, 5)]);

    act(() => {
      createRoot(container).render(
        <MemoryRouter>
          <ClusterScreen />
        </MemoryRouter>,
      );
    });

    expect(container.textContent).toContain('1 distinct sound');
  });

  it('shows guidance text for single cluster', () => {
    setClusterState([makeCluster(0, 5)]);

    act(() => {
      createRoot(container).render(
        <MemoryRouter>
          <ClusterScreen />
        </MemoryRouter>,
      );
    });

    expect(container.textContent).toContain('Try tapping different surfaces');
  });

  it('does not show single-cluster guidance for multiple clusters', () => {
    setClusterState([makeCluster(0, 5), makeCluster(1, 3)]);

    act(() => {
      createRoot(container).render(
        <MemoryRouter>
          <ClusterScreen />
        </MemoryRouter>,
      );
    });

    expect(container.textContent).not.toContain('Try tapping different surfaces');
  });

  it('renders Continue button', () => {
    setClusterState([makeCluster(0, 5)]);

    act(() => {
      createRoot(container).render(
        <MemoryRouter>
          <ClusterScreen />
        </MemoryRouter>,
      );
    });

    const buttons = container.querySelectorAll('button');
    const continueButton = Array.from(buttons).find((b) => b.textContent.includes('Continue'));
    expect(continueButton).not.toBeUndefined();
  });

  it('renders a play button on each cluster card', () => {
    setClusterState([makeCluster(0, 5), makeCluster(1, 3)]);

    act(() => {
      createRoot(container).render(
        <MemoryRouter>
          <ClusterScreen />
        </MemoryRouter>,
      );
    });

    const playButtons = container.querySelectorAll('button[aria-label^="Play cluster"]');
    expect(playButtons.length).toBe(2);
  });

  it('renders without crashing with empty clusters', () => {
    setClusterState([]);

    act(() => {
      createRoot(container).render(
        <MemoryRouter>
          <ClusterScreen />
        </MemoryRouter>,
      );
    });

    expect(container.innerHTML).not.toBe('');
  });

  it('shows hit count per cluster', () => {
    setClusterState([makeCluster(0, 7), makeCluster(1, 3)]);

    act(() => {
      createRoot(container).render(
        <MemoryRouter>
          <ClusterScreen />
        </MemoryRouter>,
      );
    });

    expect(container.textContent).toContain('7 hits');
    expect(container.textContent).toContain('3 hits');
  });

  it('renders back button', () => {
    setClusterState([makeCluster(0, 5)]);

    act(() => {
      createRoot(container).render(
        <MemoryRouter>
          <ClusterScreen />
        </MemoryRouter>,
      );
    });

    const backButton = container.querySelector('button[aria-label="Go back"]');
    expect(backButton).not.toBeNull();
  });
});

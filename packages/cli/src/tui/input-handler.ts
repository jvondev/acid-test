// 🏛️ KEYBOARD INPUT DISPATCHER
// Under 120 lines - Apple-Grade Spatial Arrow Navigation & Zero Latency Action Routing

import type readline from 'readline';
import type { RatatuiEngine } from './engine.js';
import { DOMAIN_TABS } from './renderers/tabs.js';

export class InputHandler {
  constructor(private engine: RatatuiEngine) {}

  public handleKeypress(str: string, key: readline.Key): void {
    if (key.name === 'q' || (key.ctrl && key.name === 'c')) {
      this.engine.stop();
      return;
    }

    if (this.engine.getViewState() === 'OPENING') {
      if (key.name === 'return' || key.name === 'space' || key.name === 'escape') {
        this.engine.skipOpeningToCockpit();
        return;
      }
    }

    if (key.name === 'escape') {
      this.engine.setActiveModal('none');
      return;
    }

    const activeModal = this.engine.getActiveModal();

    if (activeModal === 'chaos') {
      this.handleChaosInput(str, key);
      return;
    }

    if (activeModal === 'filter') {
      this.handleFilterInput(str);
      return;
    }

    if (activeModal !== 'none') {
      if (str === 'v' || str === 'V' || str === '?' || str === 'h') {
        this.engine.setActiveModal('none');
      }
      return;
    }

    // 1. Horizontal Domain Tab Navigation (Left / Right Arrow or 1-9)
    if (key.name === 'left') {
      const currentIdx = DOMAIN_TABS.findIndex((t) => t.id === this.engine.getCurrentTab());
      const prevIdx = (currentIdx - 1 + DOMAIN_TABS.length) % DOMAIN_TABS.length;
      this.engine.setCurrentTab(DOMAIN_TABS[prevIdx].id);
      this.engine.setSelectedIndex(0);
      return;
    }

    if (key.name === 'right') {
      const currentIdx = DOMAIN_TABS.findIndex((t) => t.id === this.engine.getCurrentTab());
      const nextIdx = (currentIdx + 1) % DOMAIN_TABS.length;
      this.engine.setCurrentTab(DOMAIN_TABS[nextIdx].id);
      this.engine.setSelectedIndex(0);
      return;
    }

    const tabIdx = parseInt(str, 10);
    if (!isNaN(tabIdx) && tabIdx >= 1 && tabIdx <= 9) {
      this.engine.setCurrentTab(DOMAIN_TABS[tabIdx - 1].id);
      this.engine.setSelectedIndex(0);
      return;
    }

    // 2. Vertical Invariants Navigation (Up / Down Arrow or j / k)
    const total = this.engine.getFilteredCount();
    if (key.name === 'up' || str === 'k') {
      this.engine.setSelectedIndex(Math.max(0, this.engine.getSelectedIndex() - 1));
      return;
    }
    if (key.name === 'down' || str === 'j') {
      this.engine.setSelectedIndex(Math.min(Math.max(0, total - 1), this.engine.getSelectedIndex() + 1));
      return;
    }

    // 3. Actions
    if (str === 'p' || str === 'P') {
      this.engine.triggerAiPromptExport();
      return;
    }

    if (key.name === 'return') {
      this.engine.showToast(`Inspecting selected invariant`);
      return;
    }

    if (key.name === 'space' || str === 'a' || str === 'A') {
      this.engine.runAudit();
      return;
    }

    if (str === 'v' || str === 'V') {
      this.engine.setActiveModal('executive');
      return;
    }

    if (str === 'c' || str === 'C') {
      this.engine.setActiveModal('chaos');
      return;
    }

    if (str === '/') {
      this.engine.setActiveModal('filter');
      return;
    }

    if (str === '?' || str === 'h') {
      this.engine.setActiveModal('help');
      return;
    }

    if (str === 'H') {
      this.engine.exportHtmlReport();
      return;
    }
  }

  private handleChaosInput(str: string, key: readline.Key): void {
    const config = this.engine.getChaosConfig();
    if (str === '1') config.concurrency = 10;
    if (str === '2') config.concurrency = 25;
    if (str === '3') config.concurrency = 50;
    if (str === '4') config.concurrency = 100;
    if (str === '5') config.jitterMs = 0;
    if (str === '6') config.jitterMs = 5;
    if (str === '7') config.jitterMs = 25;
    if (str === '8') config.jitterMs = 100;
    if (str === 'c' || str === 'C') this.engine.setActiveModal('none');
    if (key.name === 'space') this.engine.runAudit();
  }

  private handleFilterInput(str: string): void {
    const filter = this.engine.getFilterState();
    if (str === '1') filter.severityFilter = undefined;
    if (str === '2') filter.severityFilter = 'CRITICAL';
    if (str === '3') filter.severityFilter = 'HIGH';
    if (str === '4') filter.severityFilter = 'MEDIUM';
    if (str === '5') filter.statusFilter = undefined;
    if (str === '6') filter.statusFilter = 'FAIL';
    if (str === '7') filter.statusFilter = 'PASS';
    if (str === '/') this.engine.setActiveModal('none');
  }
}

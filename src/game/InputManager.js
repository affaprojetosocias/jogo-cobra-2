// Responsável por traduzir entradas de teclado, mouse e toque em uma direção alvo.
export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.activeVector = { x: 1, y: 0 };
    this.mouseVector = null;
    this.keys = new Set();
    this.isPointerActive = false;
    this.pointerAnchor = null;
    this.pointerMode = 'mouse';
    this.pointerId = null;
    this.swipeStart = null;
    this.swipeThreshold = 18;
    this.controlButtons = Array.from(options.controlButtons || []);
    this.controlButtonHandlers = [];
    this.touchMoveFrame = null;
    this.lastTouchPoint = null;
    this.touchSmoothing = 0.22;

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.handlePointerCancel = this.handlePointerCancel.bind(this);
  }

  // Inicia escuta de eventos e garante limpeza posterior.
  attach() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.canvas.addEventListener('pointerdown', this.handlePointerDown, { passive: false });
    window.addEventListener('pointermove', this.handlePointerMove, { passive: false });
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointercancel', this.handlePointerCancel);
  }

  detach() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown, { passive: false });
    window.removeEventListener('pointermove', this.handlePointerMove, { passive: false });
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointercancel', this.handlePointerCancel);
    this.unbindDirectionalButtons();
    this.cancelTouchUpdate();
  }

  bindDirectionalButtons() {
    if (!this.controlButtons.length) {
      return;
    }

    const map = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 },
    };

    for (const button of this.controlButtons) {
      const direction = button.dataset.direction;
      const vector = map[direction];
      if (!vector) continue;

      const pointerDown = (event) => {
        event.preventDefault();
        this.applyDirectionalInput(vector);
      };

      const pointerEnter = (event) => {
        if ((event.buttons & 1) === 0) {
          return;
        }
        event.preventDefault();
        this.applyDirectionalInput(vector);
      };

      const activate = (event) => {
        event.preventDefault();
        this.applyDirectionalInput(vector);
      };

      button.addEventListener('pointerdown', pointerDown, { passive: false });
      button.addEventListener('pointerenter', pointerEnter, { passive: false });
      button.addEventListener('click', activate);

      this.controlButtonHandlers.push({
        button,
        handlers: [
          ['pointerdown', pointerDown],
          ['pointerenter', pointerEnter],
          ['click', activate],
        ],
      });
    }
  }

  unbindDirectionalButtons() {
    for (const binding of this.controlButtonHandlers) {
      for (const [event, handler] of binding.handlers) {
        binding.button.removeEventListener(event, handler);
      }
    }
    this.controlButtonHandlers = [];
  }

  handleKeyDown(event) {
    const key = event.key.toLowerCase();
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
      this.keys.add(key);
      event.preventDefault();
    }
  }

  handleKeyUp(event) {
    this.keys.delete(event.key.toLowerCase());
  }

  handlePointerDown(event) {
    this.pointerMode = event.pointerType === 'touch' ? 'touch' : 'mouse';
    this.isPointerActive = true;
    this.pointerId = event.pointerId;

    if (this.pointerMode === 'touch') {
      this.cancelTouchUpdate();
      this.swipeStart = { x: event.clientX, y: event.clientY };
      this.lastTouchPoint = { x: event.clientX, y: event.clientY };
      this.mouseVector = this.mouseVector || { ...this.activeVector };
      if (typeof this.canvas.setPointerCapture === 'function') {
        this.canvas.setPointerCapture(event.pointerId);
      }
      event.preventDefault();
      return;
    }

    this.updatePointerVector(event);
  }

  handlePointerMove(event) {
    if (!this.isPointerActive || (this.pointerMode === 'touch' && event.pointerId !== this.pointerId)) {
      return;
    }

    if (this.pointerMode === 'touch') {
      this.lastTouchPoint = { x: event.clientX, y: event.clientY };
      this.scheduleTouchUpdate();
      event.preventDefault();
      return;
    }

    this.updatePointerVector(event);
  }

  handlePointerUp(event) {
    if (this.pointerMode === 'touch' && event.pointerId === this.pointerId) {
      this.isPointerActive = false;
      this.pointerId = null;
      this.swipeStart = null;
      this.cancelTouchUpdate();
      if (typeof this.canvas.releasePointerCapture === 'function') {
        this.canvas.releasePointerCapture(event.pointerId);
      }
      return;
    }

    this.isPointerActive = false;
    this.mouseVector = null;
    this.pointerAnchor = null;
  }

  handlePointerCancel(event) {
    if (event.pointerId === this.pointerId) {
      this.handlePointerUp(event);
    }
  }

  setPointerAnchor(x, y) {
    if (this.pointerMode === 'touch') {
      return;
    }
    this.pointerAnchor = { x, y };
  }

  scheduleTouchUpdate() {
    if (this.touchMoveFrame !== null) {
      return;
    }
    this.touchMoveFrame = requestAnimationFrame(() => {
      this.touchMoveFrame = null;
      this.flushTouchMovement();
    });
  }

  flushTouchMovement() {
    if (!this.isPointerActive || !this.swipeStart || !this.lastTouchPoint) {
      return;
    }

    const dx = this.lastTouchPoint.x - this.swipeStart.x;
    const dy = this.lastTouchPoint.y - this.swipeStart.y;
    const distance = Math.hypot(dx, dy);

    if (distance <= this.swipeThreshold) {
      return;
    }

    const vector = { x: dx / distance, y: dy / distance };
    const smoothing = this.touchSmoothing;
    const smoothed = {
      x: this.activeVector.x + (vector.x - this.activeVector.x) * smoothing,
      y: this.activeVector.y + (vector.y - this.activeVector.y) * smoothing,
    };
    const length = Math.hypot(smoothed.x, smoothed.y) || 1;
    this.activeVector = { x: smoothed.x / length, y: smoothed.y / length };
    this.mouseVector = { ...this.activeVector };
  }

  cancelTouchUpdate() {
    if (this.touchMoveFrame !== null) {
      cancelAnimationFrame(this.touchMoveFrame);
      this.touchMoveFrame = null;
    }
    this.lastTouchPoint = null;
  }

  applyDirectionalInput(vector) {
    const length = Math.hypot(vector.x, vector.y) || 1;
    this.activeVector = { x: vector.x / length, y: vector.y / length };
    this.mouseVector = null;
    this.keys.clear();
    this.pointerMode = 'virtual';
    this.isPointerActive = false;
    this.pointerAnchor = null;
    this.cancelTouchUpdate();
  }

  // Converte posição do ponteiro para vetor relativo ao centro da tela.
  updatePointerVector(event) {
    const rect = this.canvas.getBoundingClientRect();
    const anchor = this.pointerAnchor || { x: rect.width / 2, y: rect.height / 2 };
    const cx = rect.left + anchor.x;
    const cy = rect.top + anchor.y;
    const dx = event.clientX - cx;
    const dy = event.clientY - cy;
    const length = Math.hypot(dx, dy) || 1;
    this.mouseVector = { x: dx / length, y: dy / length };
  }

  // Calcula direção alvo priorizando ponteiro, mas suportando teclado.
  getTargetAngle() {
    if (this.mouseVector) {
      return Math.atan2(this.mouseVector.y, this.mouseVector.x);
    }

    if (this.keys.size === 0) {
      return Math.atan2(this.activeVector.y, this.activeVector.x);
    }

    const vector = { x: 0, y: 0 };
    if (this.keys.has('w') || this.keys.has('arrowup')) vector.y -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) vector.y += 1;
    if (this.keys.has('a') || this.keys.has('arrowleft')) vector.x -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) vector.x += 1;

    const length = Math.hypot(vector.x, vector.y) || 1;
    this.activeVector = { x: vector.x / length, y: vector.y / length };
    return Math.atan2(this.activeVector.y, this.activeVector.x);
  }
}

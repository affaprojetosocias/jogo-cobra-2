// Responsável por traduzir entradas de teclado, mouse e toque em uma direção alvo.
export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.activeVector = { x: 1, y: 0 };
    this.mouseVector = null;
    this.keys = new Set();
    this.isPointerActive = false;

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
  }

  // Inicia escuta de eventos e garante limpeza posterior.
  attach() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
  }

  detach() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
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
    this.isPointerActive = true;
    this.updatePointerVector(event);
  }

  handlePointerMove(event) {
    if (!this.isPointerActive) return;
    this.updatePointerVector(event);
  }

  handlePointerUp() {
    this.isPointerActive = false;
    this.mouseVector = null;
  }

  // Converte posição do ponteiro para vetor relativo ao centro da tela.
  updatePointerVector(event) {
    const rect = this.canvas.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
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

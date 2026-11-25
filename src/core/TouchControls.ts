import { input } from "./InputHandler";

const DEAD_ZONE = 16;
const STICK_REACH = 78;

function clearDirections(): void {
  input.setPointer("dpadUp", false);
  input.setPointer("dpadDown", false);
  input.setPointer("dpadLeft", false);
  input.setPointer("dpadRight", false);
}

function aim(dx: number, dy: number): void {
  input.setPointer("dpadLeft", dx <= -DEAD_ZONE);
  input.setPointer("dpadRight", dx >= DEAD_ZONE);
  input.setPointer("dpadUp", dy <= -DEAD_ZONE);
  input.setPointer("dpadDown", dy >= DEAD_ZONE);
}

function isPageButton(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest("button, a") !== null;
}

export function mountTouchPlay(): void {
  let pointerId: number | null = null;
  let originX = 0;
  let originY = 0;
  let moved = false;

  const endGesture = (): void => {
    if (pointerId === null) return;
    const wasTap = !moved;
    pointerId = null;
    moved = false;
    clearDirections();
    if (wasTap) input.pulse("buttonA");
  };

  window.addEventListener(
    "pointerdown",
    (event) => {
      if (event.pointerType === "mouse") return;
      if (pointerId !== null) return;
      if (isPageButton(event.target)) return;

      event.preventDefault();
      pointerId = event.pointerId;
      originX = event.clientX;
      originY = event.clientY;
      moved = false;
      clearDirections();
    },
    { passive: false },
  );

  window.addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerId !== pointerId) return;

      let dx = event.clientX - originX;
      let dy = event.clientY - originY;
      if (Math.hypot(dx, dy) >= DEAD_ZONE) moved = true;

      if (dx > STICK_REACH) originX = event.clientX - STICK_REACH;
      if (dx < -STICK_REACH) originX = event.clientX + STICK_REACH;
      if (dy > STICK_REACH) originY = event.clientY - STICK_REACH;
      if (dy < -STICK_REACH) originY = event.clientY + STICK_REACH;

      dx = event.clientX - originX;
      dy = event.clientY - originY;
      aim(dx, dy);
    },
    { passive: false },
  );

  window.addEventListener("pointerup", (event) => {
    if (event.pointerId !== pointerId) return;
    endGesture();
  });
  window.addEventListener("pointercancel", (event) => {
    if (event.pointerId !== pointerId) return;
    pointerId = null;
    moved = false;
    clearDirections();
  });

  window.addEventListener(
    "touchmove",
    (event) => {
      if (pointerId === null) return;
      event.preventDefault();
    },
    { passive: false },
  );
}

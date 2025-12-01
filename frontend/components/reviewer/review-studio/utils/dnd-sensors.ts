/**
 * DnD Kit Sensor Configuration
 *
 * Configures touch and mouse sensors for card dragging.
 * Optimized for both desktop and mobile interactions.
 */

import {
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
} from "@dnd-kit/core";

import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

/**
 * Mouse/pointer activation constraint
 * Requires 8px of movement before drag starts
 * Prevents accidental drags on click
 */
const pointerConstraint = {
  distance: 8,
};

/**
 * Touch activation constraint
 * Requires 200ms long-press before drag starts
 * Allows normal scrolling without triggering drag
 */
const touchConstraint = {
  delay: 200,
  tolerance: 8,
};

/**
 * Custom hook for card drag sensors
 * Returns configured sensors for use in DndContext
 */
export function useCardSensors() {
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: pointerConstraint,
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: touchConstraint,
  });

  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  });

  return useSensors(pointerSensor, touchSensor, keyboardSensor);
}

/**
 * Alternative sensors for more immediate drag (no delay)
 * Use for desktop-only contexts where you want instant response
 */
export function useImmediateSensors() {
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 3 },
  });

  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  });

  return useSensors(pointerSensor, keyboardSensor);
}

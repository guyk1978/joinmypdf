/* global window */
(function () {
  "use strict";

  function moveInArray(arr, from, to) {
    if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) return arr;
    var next = arr.slice();
    var item = next.splice(from, 1)[0];
    next.splice(to, 0, item);
    return next;
  }

  function attachDragReorder(card, options) {
    var getIndex = options.getIndex;
    var onReorder = options.onReorder;
    var onDragState = options.onDragState;

    card.draggable = true;
    card.setAttribute("aria-grabbed", "false");

    card.addEventListener("dragstart", function (event) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(getIndex()));
      card.setAttribute("aria-grabbed", "true");
      card.classList.add("is-dragging");
      if (onDragState) onDragState(getIndex(), "start");
    });

    card.addEventListener("dragover", function (event) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      card.classList.add("is-drag-over");
      if (onDragState) onDragState(getIndex(), "over");
    });

    card.addEventListener("dragleave", function () {
      card.classList.remove("is-drag-over");
      if (onDragState) onDragState(getIndex(), "leave");
    });

    card.addEventListener("drop", function (event) {
      event.preventDefault();
      card.classList.remove("is-drag-over");
      var from = Number(event.dataTransfer.getData("text/plain"));
      var to = getIndex();
      if (!Number.isNaN(from)) onReorder(from, to);
      if (onDragState) onDragState(null, "drop");
    });

    card.addEventListener("dragend", function () {
      card.classList.remove("is-dragging", "is-drag-over");
      card.setAttribute("aria-grabbed", "false");
      if (onDragState) onDragState(null, "end");
    });
  }

  function clearGridDragState(grid) {
    if (!grid) return;
    grid.querySelectorAll(".is-drag-over, .is-dragging").forEach(function (el) {
      el.classList.remove("is-drag-over", "is-dragging");
    });
  }

  window.VisualReorder = {
    moveInArray: moveInArray,
    attachDragReorder: attachDragReorder,
    clearGridDragState: clearGridDragState,
  };
})();

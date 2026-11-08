import { afterEach, expect, it, vi } from "vitest";
import { restoreSavedScrollPosition } from "./scrollRestoration.js";

afterEach(() => {
  vi.restoreAllMocks();
  document.body.replaceChildren();
  delete document.documentElement.dataset.restoringCatalogScroll;
});

it("keeps the catalog hidden until the lazy card is in its restored position", () => {
  let scrollY = 0;
  let nextFrame;
  vi.spyOn(window, "scrollY", "get").mockImplementation(() => scrollY);
  const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(({ top }) => {
    scrollY = top;
  });
  vi.spyOn(document.documentElement, "scrollHeight", "get").mockReturnValue(4000);
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    nextFrame = callback;
    return 1;
  });

  function addAnchor(id, documentTop) {
    const element = document.createElement("div");
    element.id = id;
    vi.spyOn(element, "getBoundingClientRect").mockImplementation(() => ({
      top: documentTop - scrollY,
    }));
    document.body.append(element);
  }

  addAnchor("card-shell", 2100);
  const onComplete = vi.fn();
  restoreSavedScrollPosition({
    anchorId: "card",
    anchorViewportOffsetTop: 200,
    sectionId: "",
    left: 0,
    top: 2200,
  }, onComplete);

  expect(scrollTo).toHaveBeenLastCalledWith({ top: 1900, left: 0, behavior: "instant" });
  nextFrame();
  expect(document.documentElement).toHaveAttribute("data-restoring-catalog-scroll");
  expect(onComplete).not.toHaveBeenCalled();

  addAnchor("card", 2400);
  nextFrame();
  expect(scrollTo).toHaveBeenLastCalledWith({ top: 2200, left: 0, behavior: "instant" });
  expect(document.documentElement).toHaveAttribute("data-restoring-catalog-scroll");

  nextFrame();
  expect(document.documentElement).not.toHaveAttribute("data-restoring-catalog-scroll");
  expect(onComplete).toHaveBeenCalledOnce();
});

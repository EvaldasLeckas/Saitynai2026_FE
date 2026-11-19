export const triggerAnimation = (element, animation) => {
  element.classList.remove(animation);

  // Restart animation
  void element.offsetWidth;

  element.classList.add(animation);

  element.addEventListener(
    "animationend",
    () => element.classList.remove(animation),
    { once: true }
  );
};
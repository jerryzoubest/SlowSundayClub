(() => {
  const step = (button, direction) => {
    const wrap = button.closest(".ssc-stepper");
    const input = wrap && wrap.querySelector("input");
    if (!input) return;
    const min = Number(input.min || 0);
    const value = Number(input.value || min);
    input.value = Math.max(min, value + direction);
    input.dispatchEvent(new Event("change", { bubbles: true }));
  };

  document.addEventListener("click", (event) => {
    const minus = event.target.closest("[data-ssc-minus]");
    const plus = event.target.closest("[data-ssc-plus]");
    if (minus) step(minus, -1);
    if (plus) step(plus, 1);

    const thumb = event.target.closest("[data-ssc-thumb]");
    if (thumb) {
      const product = thumb.closest(".ssc-product");
      const mainImage = product && product.querySelector(".ssc-product__image img");
      if (mainImage) {
        mainImage.src = thumb.dataset.sscThumb;
        mainImage.srcset = "";
        mainImage.alt = thumb.dataset.sscAlt || mainImage.alt;
      }
    }
  });

  document.querySelectorAll(".ssc-product").forEach((product) => {
    const variantsNode = product.querySelector("[data-ssc-variants]");
    const form = product.querySelector(".ssc-product-form");
    if (!variantsNode || !form) return;

    let variants = [];
    try {
      variants = JSON.parse(variantsNode.textContent);
    } catch (error) {
      return;
    }

    const idInput = form.querySelector('input[name="id"]');
    const submit = form.querySelector('button[type="submit"]');

    form.addEventListener("change", () => {
      const selected = Array.from(form.querySelectorAll(".ssc-option")).map((fieldset) => {
        const checked = fieldset.querySelector("input:checked");
        return checked && checked.value;
      });

      const variant = variants.find((item) => {
        return selected.every((value, index) => item.options[index] === value);
      });

      if (!variant || !idInput) return;
      idInput.value = variant.id;
      if (submit) {
        submit.disabled = !variant.available;
        submit.textContent = variant.available ? "Add To Cart" : "Sold Out";
      }
    });
  });
})();

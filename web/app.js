(() => {
  "use strict";

  const sourceCatalog = Array.isArray(window.LAYOUT_CATALOG) ? window.LAYOUT_CATALOG : [];
  const contentBySourceId = window.LAYOUT_CONTENT || {};
  const catalog = sourceCatalog.map((item) => {
    const content = contentBySourceId[item.id];
    if (!content) return item;
    return {
      ...item,
      sourceName: item.name,
      matchId: content.matchId,
      name: content.name,
      category: content.category,
      category_slug: content.categorySlug,
      subcategory: content.subcategory,
      subcategory_slug: content.subcategorySlug,
      description: content.description,
      prompt: content.prompt,
    };
  });
  const gallery = document.querySelector("#gallery");
  const filters = document.querySelector("#categoryFilters");
  const searchInput = document.querySelector("#searchInput");
  const resultCount = document.querySelector("#resultCount");
  const emptyState = document.querySelector("#emptyState");
  const resetButton = document.querySelector("#resetButton");
  const dialog = document.querySelector("#detailDialog");
  const detailImage = document.querySelector("#detailImage");
  const imageStatus = document.querySelector("#imageStatus");
  const detailEyebrow = document.querySelector("#detailEyebrow");
  const detailTitle = document.querySelector("#detailTitle");
  const detailDescription = document.querySelector("#detailDescription");
  const detailPrompt = document.querySelector("#detailPrompt");
  const detailTags = document.querySelector("#detailTags");
  const closeButton = document.querySelector("#closeButton");
  const copyButton = document.querySelector("#copyButton");
  const toast = document.querySelector("#toast");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const state = {
    category: "全部",
    query: "",
    activeItem: null,
    sourceCard: null,
    openAnimation: null,
    closeAnimation: null,
    imageRequest: 0,
    toastTimer: null,
  };

  const categoryCounts = catalog.reduce((counts, item) => {
    counts.set(item.category, (counts.get(item.category) || 0) + 1);
    return counts;
  }, new Map());

  const categories = ["全部", ...categoryCounts.keys()];
  const previewRatios = ["3 / 4", "4 / 5", "5 / 6", "7 / 9", "3 / 4", "4 / 5"];

  function createSvgArrow() {
    const namespace = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(namespace, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS(namespace, "path");
    path.setAttribute("d", "M7 17 17 7M8 7h9v9");
    svg.append(path);
    return svg;
  }

  function renderFilters() {
    const fragment = document.createDocumentFragment();

    categories.forEach((category) => {
      const button = document.createElement("button");
      const count = category === "全部" ? catalog.length : categoryCounts.get(category);
      button.className = "filter-button";
      button.type = "button";
      button.dataset.category = category;
      button.setAttribute("aria-pressed", String(state.category === category));
      button.append(document.createTextNode(category));

      const countLabel = document.createElement("span");
      countLabel.textContent = String(count);
      button.append(countLabel);

      button.addEventListener("click", () => {
        state.category = category;
        filters.querySelectorAll(".filter-button").forEach((filterButton) => {
          filterButton.setAttribute("aria-pressed", String(filterButton.dataset.category === category));
        });
        renderGallery();
      });

      fragment.append(button);
    });

    filters.replaceChildren(fragment);
  }

  function createCard(item, index) {
    const article = document.createElement("article");
    article.className = "layout-card";
    article.dataset.id = item.id;
    article.style.setProperty("--preview-ratio", previewRatios[Number(item.id) % previewRatios.length]);
    article.style.setProperty("--enter-delay", `${Math.min(index % 18, 9) * 26}ms`);

    const button = document.createElement("button");
    button.className = "card-trigger";
    button.type = "button";
    button.setAttribute("aria-label", `展开 ${item.id} ${item.name}`);
    button.setAttribute("aria-haspopup", "dialog");
    button.setAttribute("aria-expanded", "false");

    const media = document.createElement("span");
    media.className = "card-media";

    const image = document.createElement("img");
    image.src = item.thumbnail;
    image.alt = `${item.id} ${item.name}`;
    image.width = item.width;
    image.height = item.height;
    image.loading = index < 14 ? "eager" : "lazy";
    image.decoding = "async";

    const number = document.createElement("span");
    number.className = "card-number";
    number.textContent = item.id;

    const overlay = document.createElement("span");
    overlay.className = "card-overlay";

    const meta = document.createElement("span");
    meta.className = "card-meta";
    meta.textContent = item.category;

    const title = document.createElement("h2");
    title.textContent = item.name;

    const subcategory = document.createElement("span");
    subcategory.className = "card-subcategory";
    subcategory.textContent = item.subcategory;

    const openHint = document.createElement("span");
    openHint.className = "card-open-hint";
    openHint.append(document.createTextNode("原地展开"), createSvgArrow());

    overlay.append(meta, title, subcategory, openHint);
    media.append(image, number, overlay);
    button.append(media);
    button.addEventListener("click", () => openDetail(item, article, button));
    article.append(button);

    return article;
  }

  function getFilteredItems() {
    const normalizedQuery = state.query.trim().toLocaleLowerCase("zh-CN");

    return catalog.filter((item) => {
      const matchesCategory = state.category === "全部" || item.category === state.category;
      if (!matchesCategory) return false;
      if (!normalizedQuery) return true;

      const searchable = `${item.id} ${item.name} ${item.category} ${item.subcategory} ${item.prompt || ""}`.toLocaleLowerCase("zh-CN");
      return searchable.includes(normalizedQuery);
    });
  }

  function renderGallery() {
    const items = getFilteredItems();
    const fragment = document.createDocumentFragment();
    items.forEach((item, index) => fragment.append(createCard(item, index)));
    gallery.replaceChildren(fragment);
    gallery.hidden = items.length === 0;
    emptyState.hidden = items.length !== 0;
    resultCount.textContent = `${items.length} 张`;
  }

  function getTargetRect(sourceRect) {
    const gutter = 32;
    const width = Math.min(1020, window.innerWidth - gutter * 2);
    const height = Math.min(730, window.innerHeight - gutter * 2);
    const desiredLeft = sourceRect.left + sourceRect.width / 2 - width / 2;
    const desiredTop = sourceRect.top + sourceRect.height / 2 - height / 2;

    return {
      left: Math.max(gutter, Math.min(window.innerWidth - width - gutter, desiredLeft)),
      top: Math.max(gutter, Math.min(window.innerHeight - height - gutter, desiredTop)),
      width,
      height,
    };
  }

  function populateDetail(item) {
    state.imageRequest += 1;
    const requestId = state.imageRequest;

    detailImage.src = item.thumbnail;
    detailImage.alt = `${item.id} ${item.name} 说明图`;
    detailEyebrow.textContent = `${item.id} · ${item.category}`;
    detailTitle.textContent = item.name;
    detailDescription.textContent = item.description || `这张卡片示范「${item.name}」的核心结构。`;
    detailPrompt.textContent = item.prompt || `请以「${item.name}」为核心完成设计，并保持层级清晰、阅读路径自然。`;
    detailTags.replaceChildren();

    [item.category, item.subcategory, `${item.width} × ${item.height}`].forEach((label) => {
      const tag = document.createElement("span");
      tag.className = "detail-tag";
      tag.textContent = label;
      detailTags.append(tag);
    });

    copyButton.classList.remove("is-copied");
    copyButton.querySelector("span").textContent = "复制提示词";
    dialog.classList.remove("has-image-error");
    dialog.classList.add("is-loading");
    imageStatus.hidden = false;
    imageStatus.textContent = "正在载入高清图";

    const highResolutionImage = new Image();
    highResolutionImage.decoding = "async";
    highResolutionImage.onload = () => {
      if (requestId !== state.imageRequest || state.activeItem?.id !== item.id) return;
      detailImage.src = item.image;
      dialog.classList.remove("is-loading");
      imageStatus.hidden = true;
    };
    highResolutionImage.onerror = () => {
      if (requestId !== state.imageRequest) return;
      dialog.classList.remove("is-loading");
      dialog.classList.add("has-image-error");
      imageStatus.textContent = "高清图载入失败，当前显示预览图";
    };
    highResolutionImage.src = item.image;
  }

  function openDetail(item, sourceCard, trigger) {
    if (dialog.open || state.closeAnimation) return;

    const sourceRect = trigger.getBoundingClientRect();
    const targetRect = getTargetRect(sourceRect);
    state.activeItem = item;
    state.sourceCard = sourceCard;
    populateDetail(item);

    Object.assign(dialog.style, {
      left: `${targetRect.left}px`,
      top: `${targetRect.top}px`,
      width: `${targetRect.width}px`,
      height: `${targetRect.height}px`,
    });

    dialog.showModal();
    document.body.classList.add("detail-open");
    sourceCard.classList.add("is-source");
    trigger.setAttribute("aria-expanded", "true");

    if (!reducedMotion.matches) {
      const offsetX = sourceRect.left - targetRect.left;
      const offsetY = sourceRect.top - targetRect.top;
      const scaleX = sourceRect.width / targetRect.width;
      const scaleY = sourceRect.height / targetRect.height;

      state.openAnimation = dialog.animate(
        [
          {
            opacity: 0.5,
            transform: `translate(${offsetX}px, ${offsetY}px) scale(${scaleX}, ${scaleY})`,
            borderRadius: "16px",
          },
          { opacity: 1, transform: "translate(0, 0) scale(1)", borderRadius: "24px" },
        ],
        { duration: 390, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "both" },
      );

      state.openAnimation.finished
        .then(() => {
          state.openAnimation = null;
          if (dialog.open) closeButton.focus({ preventScroll: true });
        })
        .catch(() => {});
    } else {
      closeButton.focus({ preventScroll: true });
    }
  }

  function finishClose() {
    const trigger = state.sourceCard?.querySelector(".card-trigger");
    state.imageRequest += 1;
    dialog.close();
    dialog.getAnimations().forEach((animation) => animation.cancel());
    document.body.classList.remove("detail-open");
    state.sourceCard?.classList.remove("is-source");
    trigger?.setAttribute("aria-expanded", "false");
    trigger?.focus({ preventScroll: true });
    state.activeItem = null;
    state.sourceCard = null;
    state.closeAnimation = null;
  }

  function closeDetail() {
    if (!dialog.open || state.closeAnimation) return;
    state.openAnimation?.cancel();
    state.openAnimation = null;

    const trigger = state.sourceCard?.querySelector(".card-trigger");
    const sourceRect = trigger?.getBoundingClientRect();
    const dialogRect = dialog.getBoundingClientRect();

    if (reducedMotion.matches || !sourceRect) {
      finishClose();
      return;
    }

    const offsetX = sourceRect.left - dialogRect.left;
    const offsetY = sourceRect.top - dialogRect.top;
    const scaleX = sourceRect.width / dialogRect.width;
    const scaleY = sourceRect.height / dialogRect.height;

    state.closeAnimation = dialog.animate(
      [
        { opacity: 1, transform: "translate(0, 0) scale(1)", borderRadius: "24px" },
        {
          opacity: 0.25,
          transform: `translate(${offsetX}px, ${offsetY}px) scale(${scaleX}, ${scaleY})`,
          borderRadius: "16px",
        },
      ],
      { duration: 250, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "both" },
    );

    state.closeAnimation.finished.then(finishClose).catch(finishClose);
  }

  async function copyDetail() {
    if (!state.activeItem) return;
    const item = state.activeItem;
    const text = detailPrompt.textContent.trim();

    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.append(textarea);
        textarea.select();
        const copied = document.execCommand("copy");
        textarea.remove();
        if (!copied) throw new Error("copy command failed");
      }

      copyButton.classList.add("is-copied");
      copyButton.querySelector("span").textContent = "已复制";
      showToast(`已复制「${item.name}」提示词`);
    } catch {
      showToast("复制失败，请手动选择上方提示词");
    }
  }

  function showToast(message) {
    window.clearTimeout(state.toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    state.toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
  }

  let searchTimer;
  searchInput.addEventListener("input", () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => {
      state.query = searchInput.value;
      renderGallery();
    }, 120);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "/" && !dialog.open && document.activeElement !== searchInput) {
      event.preventDefault();
      searchInput.focus();
    }
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDetail();
  });

  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDetail();
  });

  closeButton.addEventListener("click", closeDetail);
  copyButton.addEventListener("click", copyDetail);
  resetButton.addEventListener("click", () => {
    state.category = "全部";
    state.query = "";
    searchInput.value = "";
    renderFilters();
    renderGallery();
    searchInput.focus();
  });

  renderFilters();
  renderGallery();
})();

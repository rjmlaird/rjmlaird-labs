const form = document.querySelector("#positioning-form");

    const fields = {
      name: document.querySelector("#brand-name"),
      note: document.querySelector("#brand-note"),
      type: document.querySelector("#brand-type"),
      xLow: document.querySelector("#x-low"),
      xHigh: document.querySelector("#x-high"),
      yLow: document.querySelector("#y-low"),
      yHigh: document.querySelector("#y-high"),
      xScore: document.querySelector("#x-score"),
      yScore: document.querySelector("#y-score"),
      demoPicker: document.querySelector("#demo-picker")
    };

    const display = {
      xScoreValue: document.querySelector("#x-score-value"),
      yScoreValue: document.querySelector("#y-score-value"),
      brandCount: document.querySelector("#brand-count"),
      xAxisLow: document.querySelector("#x-axis-low"),
      xAxisHigh: document.querySelector("#x-axis-high"),
      yAxisLow: document.querySelector("#y-axis-low"),
      yAxisHigh: document.querySelector("#y-axis-high"),
      xAxisLabelLow: document.querySelector("#x-axis-label-low"),
      xAxisLabelHigh: document.querySelector("#x-axis-label-high"),
      yAxisTitle: document.querySelector("#y-axis-title"),
      detailTitle: document.querySelector("#detail-title"),
      detailNote: document.querySelector("#detail-note"),
      detailType: document.querySelector("#detail-type"),
      detailX: document.querySelector("#detail-x"),
      detailY: document.querySelector("#detail-y"),
      detailPrompt: document.querySelector("#detail-prompt"),
      densityInsight: document.querySelector("#density-insight"),
      opportunityInsight: document.querySelector("#opportunity-insight"),
      evidenceInsight: document.querySelector("#evidence-insight"),
      perceptualGrid: document.querySelector("#perceptual-grid"),
      guidanceList: document.querySelector("#guidance-list")
    };

    const typeConfig = {
      own: {
        label: "Your brand",
        colour: "var(--teal)"
      },
      competitor: {
        label: "Competitor",
        colour: "var(--purple)"
      },
      substitute: {
        label: "Substitute / adjacent alternative",
        colour: "var(--amber)"
      }
    };

    let brands = [
      {
        id: "your-brand",
        name: "Your Brand",
        type: "own",
        x: 72,
        y: 74,
        note:
          "Illustrative own-brand position. Validate with customer interviews, ratings research, usability testing, review analysis and competitor comparison."
      },
      {
        id: "enterprise-suite",
        name: "Enterprise Suite",
        type: "competitor",
        x: 84,
        y: 81,
        note:
          "Perceived as feature-rich and high value by some larger organisations, but may be seen as complex or resource-intensive by smaller teams."
      },
      {
        id: "template-toolkit",
        name: "Template Toolkit",
        type: "competitor",
        x: 45,
        y: 48,
        note:
          "Often perceived as accessible and practical, though customers may see it as less specialised for complex or collaborative planning needs."
      },
      {
        id: "general-workspace",
        name: "General Workspace",
        type: "substitute",
        x: 30,
        y: 52,
        note:
          "An adjacent option customers may consider because it is familiar and flexible, although it is not purpose-built for the category."
      },
      {
        id: "specialist-consultancy",
        name: "Specialist Consultancy",
        type: "substitute",
        x: 90,
        y: 92,
        note:
          "May be viewed as highly specialised and valuable for complex needs, while potentially being perceived as less scalable or less accessible for routine use."
      }
    ];

    let selectedId = "your-brand";

    const getAxes = () => ({
      xLow: fields.xLow.value.trim() || "Lower end",
      xHigh: fields.xHigh.value.trim() || "Higher end",
      yLow: fields.yLow.value.trim() || "Lower end",
      yHigh: fields.yHigh.value.trim() || "Higher end"
    });

    const shortText = (text, length = 19) => {
      const clean = String(text || "").replace(/\s+/g, " ").trim();
      return clean.length > length ? `${clean.slice(0, length - 1)}…` : clean;
    };

    const updateRangeOutputs = () => {
      display.xScoreValue.textContent = `${fields.xScore.value} / 100`;
      display.yScoreValue.textContent = `${fields.yScore.value} / 100`;
    };

    const renderAxes = () => {
      const axes = getAxes();

      display.xAxisLow.textContent = axes.xLow;
      display.xAxisHigh.textContent = axes.xHigh;
      display.yAxisLow.textContent = axes.yLow;
      display.yAxisHigh.textContent = axes.yHigh;
      display.xAxisLabelLow.textContent = axes.xLow;
      display.xAxisLabelHigh.textContent = axes.xHigh;
      display.yAxisTitle.textContent = `${axes.yLow} → ${axes.yHigh}`;
    };

    const populateForm = (brand) => {
      fields.name.value = brand.name || "";
      fields.note.value = brand.note || "";
      fields.type.value = brand.type || "competitor";
      fields.xScore.value = brand.x ?? 50;
      fields.yScore.value = brand.y ?? 50;
      updateRangeOutputs();
    };

    const selectBrand = (id) => {
      const brand = brands.find((item) => item.id === id);
      if (!brand) return;

      selectedId = id;
      populateForm(brand);
      renderMap();
    };

    const getQuadrant = (brand) => {
      const horizontal = brand.x >= 50 ? "right" : "left";
      const vertical = brand.y >= 50 ? "top" : "bottom";
      return `${vertical}-${horizontal}`;
    };

    const nearestBrand = (brand) => {
      const alternatives = brands.filter((item) => item.id !== brand.id);
      if (!alternatives.length) return null;

      return alternatives
        .map((item) => ({
          item,
          distance: Math.hypot(item.x - brand.x, item.y - brand.y)
        }))
        .sort((a, b) => a.distance - b.distance)[0];
    };

    const renderMap = () => {
      updateRangeOutputs();
      renderAxes();

      display.perceptualGrid
        .querySelectorAll(".brand-bubble")
        .forEach((bubble) => bubble.remove());

      const selected = brands.find((brand) => brand.id === selectedId);

      brands.forEach((brand, index) => {
        const bubble = document.createElement("button");
        const config = typeConfig[brand.type];
        const isSelected = brand.id === selectedId;
        const size = Math.max(58, Math.min(108, 65 + Math.sqrt(index + 1) * 12));

        bubble.type = "button";
        bubble.className = `brand-bubble ${brand.type === "own" ? "own-brand" : ""} ${isSelected ? "selected" : ""} ${selectedId && !isSelected ? "dimmed" : ""}`;
        bubble.dataset.id = brand.id;
        bubble.style.setProperty("--bubble-size", `${size}px`);
        bubble.style.setProperty("--bubble-color", config.colour);
        bubble.style.left = `${Math.max(6, Math.min(94, brand.x))}%`;
        bubble.style.bottom = `${Math.max(6, Math.min(94, brand.y))}%`;
        bubble.setAttribute(
          "aria-label",
          `${brand.name}, ${config.label}, horizontal score ${brand.x} of 100, vertical score ${brand.y} of 100`
        );

        bubble.innerHTML = `
          <span>${shortText(brand.name)}</span>
          <small>${brand.type === "own" ? "Your brand" : config.label}</small>
        `;

        bubble.addEventListener("click", () => selectBrand(brand.id));
        display.perceptualGrid.appendChild(bubble);
      });

      document.querySelectorAll(".quadrant-shade").forEach((shade, index) => {
        if (!selected) {
          shade.classList.remove("dimmed");
          return;
        }

        const targetQuadrant = getQuadrant(selected);
        const quadrantOrder = ["top-left", "top-right", "bottom-left", "bottom-right"];
        shade.classList.toggle("dimmed", quadrantOrder[index] !== targetQuadrant);
      });

      display.brandCount.textContent = brands.length;

      if (selected) {
        const axes = getAxes();
        const config = typeConfig[selected.type];
        const closest = nearestBrand(selected);

        display.detailTitle.textContent = selected.name;
        display.detailNote.textContent =
          selected.note || "No evidence or perception note has been added.";
        display.detailType.textContent = config.label;
        display.detailX.textContent =
          `${selected.x}/100 toward “${axes.xHigh}”`;
        display.detailY.textContent =
          `${selected.y}/100 toward “${axes.yHigh}”`;

        display.detailPrompt.textContent = closest
          ? `How does this position differ meaningfully from ${closest.item.name}, which appears closest on these two dimensions? Validate whether customers recognise and value that difference.`
          : "What evidence supports this position, and which customer groups experience the brand differently?";
      }

      const clusters = [];
      brands.forEach((brand) => {
        brands.forEach((other) => {
          if (brand.id >= other.id) return;
          const distance = Math.hypot(brand.x - other.x, brand.y - other.y);
          if (distance < 24) clusters.push([brand, other]);
        });
      });

      display.densityInsight.innerHTML = clusters.length
        ? `<strong>${clusters.length} close perceived pairing${clusters.length > 1 ? "s" : ""} detected.</strong> Proximity can indicate that customers see brands as similar on these attributes; test actual consideration and substitution behaviour.`
        : "<strong>No close pairings detected on these two axes.</strong> That does not prove differentiation: customers may compare brands on dimensions the map does not capture.";

      const ownBrand = brands.find((brand) => brand.type === "own");
      display.opportunityInsight.innerHTML = ownBrand
        ? `<strong>Your brand currently sits at ${ownBrand.x}/100 horizontally and ${ownBrand.y}/100 vertically.</strong> Use this as a hypothesis: identify a meaningful target position, then test whether it is desirable, credible and deliverable.`
        : "<strong>No own brand is marked.</strong> Add your brand to compare intended and perceived positioning against the alternatives customers actually consider.";

      const notesCount = brands.filter((brand) => brand.note && brand.note.trim()).length;
      display.evidenceInsight.innerHTML = notesCount === brands.length
        ? "<strong>Every plotted alternative has an evidence note.</strong> Next, record source, audience segment, sample and date so the map remains interpretable over time."
        : `<strong>${notesCount} of ${brands.length} points have an evidence note.</strong> Add the research source and confidence level behind each placement before using the map for strategic decisions.`;

      const guidance = [
        "Choose axes that genuinely influence purchase or choice in the category; common axes such as price and quality are only useful if customers use them.",
        "Include the full consideration set: direct rivals, emerging competitors, substitutes, internal alternatives and familiar workarounds.",
        "Ask customers—not only internal teams—to rate or discuss the brands. Surveys, interviews, review analysis, social listening and website user testing can complement one another.",
        "Keep segments separate when perception differs meaningfully by role, need, geography, experience level or buying context.",
        "Treat distance as a perception signal, not exact competitive truth. A two-axis map simplifies a much richer set of associations and trade-offs.",
        "Compare intended position with actual customer perception, then test whether a potential new position is valuable, credible, distinctive and operationally sustainable."
      ];

      display.guidanceList.innerHTML = "";
      guidance.forEach((tip) => {
        const item = document.createElement("li");
        item.innerHTML =
          `<span class="guidance-icon" aria-hidden="true">✓</span><span>${tip}</span>`;
        display.guidanceList.appendChild(item);
      });
    };

    const saveBrand = () => {
      const name = fields.name.value.trim();
      if (!name) {
        fields.name.focus();
        return;
      }

      const existing = brands.find((brand) => brand.id === selectedId);

      const entry = {
        id: existing ? existing.id : `brand-${Date.now()}`,
        name,
        note: fields.note.value.trim(),
        type: fields.type.value,
        x: Number(fields.xScore.value),
        y: Number(fields.yScore.value)
      };

      if (existing) {
        brands = brands.map((brand) => (brand.id === existing.id ? entry : brand));
      } else {
        brands.push(entry);
      }

      selectedId = entry.id;
      renderMap();
    };

    const removeSelected = () => {
      if (!selectedId) return;

      brands = brands.filter((brand) => brand.id !== selectedId);
      selectedId = brands[0]?.id || null;

      if (brands[0]) {
        populateForm(brands[0]);
      } else {
        fields.name.value = "";
        fields.note.value = "";
        fields.type.value = "competitor";
        fields.xScore.value = 50;
        fields.yScore.value = 50;
        updateRangeOutputs();
      }

      renderMap();
    };

    const loadDemo = (demo) => {
      const demos = {
        software: {
          axes: {
            xLow: "Less specialised",
            xHigh: "More specialised",
            yLow: "Lower perceived value",
            yHigh: "Higher perceived value"
          },
          brands: [
            {
              id: "your-brand",
              name: "Your Brand",
              type: "own",
              x: 72,
              y: 74,
              note:
                "Illustrative own-brand position. Validate with customer interviews, ratings research, usability testing, review analysis and competitor comparison."
            },
            {
              id: "enterprise-suite",
              name: "Enterprise Suite",
              type: "competitor",
              x: 84,
              y: 81,
              note:
                "Perceived as feature-rich and high value by some larger organisations, but may be seen as complex or resource-intensive by smaller teams."
            },
            {
              id: "template-toolkit",
              name: "Template Toolkit",
              type: "competitor",
              x: 45,
              y: 48,
              note:
                "Often perceived as accessible and practical, though customers may see it as less specialised for complex or collaborative planning needs."
            },
            {
              id: "general-workspace",
              name: "General Workspace",
              type: "substitute",
              x: 30,
              y: 52,
              note:
                "An adjacent option customers may consider because it is familiar and flexible, although it is not purpose-built for the category."
            },
            {
              id: "specialist-consultancy",
              name: "Specialist Consultancy",
              type: "substitute",
              x: 90,
              y: 92,
              note:
                "May be viewed as highly specialised and valuable for complex needs, while potentially being perceived as less scalable or less accessible for routine use."
            }
          ]
        },

        websites: {
          axes: {
            xLow: "Harder to use",
            xHigh: "Easier to use",
            yLow: "Lower perceived trust",
            yHigh: "Higher perceived trust"
          },
          brands: [
            {
              id: "your-brand",
              name: "Your Website",
              type: "own",
              x: 68,
              y: 71,
              note:
                "Illustrative user-testing hypothesis. Use task success, post-task confidence, comprehension, accessibility checks and qualitative feedback to establish actual perceptions."
            },
            {
              id: "market-leader",
              name: "Market Leader",
              type: "competitor",
              x: 63,
              y: 86,
              note:
                "Users may perceive the established brand as credible, though navigation complexity or dense content could reduce ease for some audiences."
            },
            {
              id: "challenger",
              name: "Digital Challenger",
              type: "competitor",
              x: 88,
              y: 63,
              note:
                "May appear easy to use and modern, while users may seek more evidence before placing trust in high-stakes decisions."
            },
            {
              id: "comparison-site",
              name: "Comparison Platform",
              type: "substitute",
              x: 75,
              y: 58,
              note:
                "A substitute path that can feel efficient for initial discovery, but may provide limited context, support or direct accountability."
            },
            {
              id: "offline-provider",
              name: "Local Provider",
              type: "substitute",
              x: 40,
              y: 76,
              note:
                "May be perceived as trustworthy because of familiarity or human contact, while online tasks and information access may be less convenient."
            }
          ]
        },

        consumer: {
          axes: {
            xLow: "Lower price",
            xHigh: "Higher price",
            yLow: "Less sustainable",
            yHigh: "More sustainable"
          },
          brands: [
            {
              id: "your-brand",
              name: "Your Refill Brand",
              type: "own",
              x: 61,
              y: 78,
              note:
                "Illustrative perception hypothesis. Assess whether buyers interpret sustainability claims as credible, relevant and worth any price or convenience trade-off."
            },
            {
              id: "premium-refill",
              name: "Premium Refill Brand",
              type: "competitor",
              x: 84,
              y: 90,
              note:
                "May be viewed as highly sustainable and premium, but price sensitivity could limit consideration among some households."
            },
            {
              id: "mainstream-brand",
              name: "Mainstream Brand",
              type: "competitor",
              x: 39,
              y: 43,
              note:
                "Often familiar and affordable, though customers may perceive its sustainability credentials as weaker or less distinctive."
            },
            {
              id: "own-label",
              name: "Retail Own Label",
              type: "competitor",
              x: 27,
              y: 49,
              note:
                "Can be perceived as good value and accessible, with sustainability associations varying by retailer and product range."
            },
            {
              id: "homemade-solution",
              name: "DIY Alternative",
              type: "substitute",
              x: 18,
              y: 69,
              note:
                "A low-cost alternative that some customers may see as sustainable, but it can carry uncertainty around effort, effectiveness and convenience."
            }
          ]
        }
      };

      const selected = demos[demo];
      if (!selected) return;

      fields.xLow.value = selected.axes.xLow;
      fields.xHigh.value = selected.axes.xHigh;
      fields.yLow.value = selected.axes.yLow;
      fields.yHigh.value = selected.axes.yHigh;

      brands = JSON.parse(JSON.stringify(selected.brands));
      selectedId = brands[0]?.id || null;
      fields.demoPicker.value = demo;

      if (brands[0]) populateForm(brands[0]);
      renderMap();
    };

    const copyMap = async () => {
      const axes = getAxes();

      const lines = [
        "BRAND POSITIONING / PERCEPTUAL MAP",
        "",
        `Horizontal axis: ${axes.xLow} → ${axes.xHigh}`,
        `Vertical axis: ${axes.yLow} → ${axes.yHigh}`,
        ""
      ];

      brands.forEach((brand) => {
        lines.push(brand.name.toUpperCase());
        lines.push(`Type: ${typeConfig[brand.type].label}`);
        lines.push(`Horizontal score: ${brand.x}/100 toward "${axes.xHigh}"`);
        lines.push(`Vertical score: ${brand.y}/100 toward "${axes.yHigh}"`);
        lines.push(`Evidence / note: ${brand.note || "Not added."}`);
        lines.push("");
      });

      lines.push(
        "Research note: A positioning map shows perceived positions on two selected attributes. Validate scores with representative customer evidence and test whether any apparent whitespace is valuable, credible and viable."
      );

      const button = document.querySelector("#copy-map");
      const originalLabel = button.textContent;

      try {
        await navigator.clipboard.writeText(lines.join("\n"));
        button.textContent = "Map copied";
      } catch {
        button.textContent = "Copy unavailable";
      }

      window.setTimeout(() => {
        button.textContent = originalLabel;
      }, 1800);
    };

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      saveBrand();
    });

    [fields.xScore, fields.yScore].forEach((field) => {
      field.addEventListener("input", updateRangeOutputs);
    });

    [fields.xLow, fields.xHigh, fields.yLow, fields.yHigh].forEach((field) => {
      field.addEventListener("input", renderMap);
    });

    fields.demoPicker.addEventListener("change", (event) => {
      if (event.target.value) loadDemo(event.target.value);
    });

    document.querySelector("#remove-brand").addEventListener("click", removeSelected);
    document.querySelector("#copy-map").addEventListener("click", copyMap);

    populateForm(brands[0]);
    renderMap();

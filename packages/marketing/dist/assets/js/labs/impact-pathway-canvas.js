const form = document.querySelector("#pathway-form");
    const board = document.querySelector("#impact-board");

    const fields = {
      projectTitle: document.querySelector("#project-title"),
      type: document.querySelector("#card-type"),
      status: document.querySelector("#card-status"),
      title: document.querySelector("#card-title"),
      description: document.querySelector("#card-description"),
      owner: document.querySelector("#card-owner"),
      assumption: document.querySelector("#card-assumption"),
      connectTo: document.querySelector("#connect-to"),
      demoPicker: document.querySelector("#demo-picker")
    };

    const detail = {
      title: document.querySelector("#detail-title"),
      description: document.querySelector("#detail-description"),
      type: document.querySelector("#detail-type"),
      status: document.querySelector("#detail-status"),
      owner: document.querySelector("#detail-owner"),
      assumption: document.querySelector("#detail-assumption")
    };

    const insights = {
      coverage: document.querySelector("#coverage-insight"),
      evidence: document.querySelector("#evidence-insight"),
      engagement: document.querySelector("#engagement-insight"),
      reviewList: document.querySelector("#review-list")
    };

    const typeConfig = {
      finding: {
        label: "Research finding",
        color: "#7da9ff",
        left: 28
      },
      stakeholder: {
        label: "Stakeholder / beneficiary",
        color: "#00c2a8",
        left: 265
      },
      activity: {
        label: "Engagement activity",
        color: "#b39cff",
        left: 500
      },
      outcome: {
        label: "Outcome / intended change",
        color: "#f4af31",
        left: 735
      },
      evidence: {
        label: "Evidence of impact",
        color: "#58d08b",
        left: 970
      }
    };

    const statusConfig = {
      planned: "Planned",
      active: "Active",
      documented: "Documented",
      validated: "Externally validated"
    };

    const boardLabels = [
      { type: "finding", label: "Research finding" },
      { type: "stakeholder", label: "Stakeholder" },
      { type: "activity", label: "Engagement activity" },
      { type: "outcome", label: "Outcome" },
      { type: "evidence", label: "Evidence" }
    ];

    let cards = [];
    let selectedCardId = null;
    let assumptionMode = false;
    let dragging = null;

    const createId = () => `card-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

    const shorten = (text, length) => {
      const clean = String(text).replace(/\s+/g, " ").trim();
      return clean.length > length ? `${clean.slice(0, length - 1)}…` : clean;
    };

    const refreshConnectionOptions = () => {
      const previous = fields.connectTo.value;

      fields.connectTo.innerHTML = `<option value="">Start a new pathway</option>`;

      cards.forEach((card) => {
        const option = document.createElement("option");
        option.value = card.id;
        option.textContent = `${typeConfig[card.type].label}: ${shorten(card.title, 42)}`;
        fields.connectTo.appendChild(option);
      });

      if (cards.some((card) => card.id === previous)) {
        fields.connectTo.value = previous;
      }
    };

    const clearCardForm = () => {
      fields.type.value = "activity";
      fields.status.value = "planned";
      fields.title.value = "";
      fields.description.value = "";
      fields.owner.value = "";
      fields.assumption.value = "";
      fields.connectTo.value = "";
      fields.title.focus();
    };

    const selectCard = (card) => {
      selectedCardId = card.id;

      detail.title.textContent = card.title;
      detail.description.textContent = card.description || "No description added.";
      detail.type.textContent = typeConfig[card.type].label;
      detail.status.textContent = statusConfig[card.status];
      detail.owner.textContent = card.owner || "No owner or partner added.";
      detail.assumption.textContent =
        card.assumption || "No assumption or risk has been recorded.";

      renderBoard();
    };

    const cardCentre = (card) => ({
      x: card.x + 98,
      y: card.y + 72
    });

    const renderBoard = () => {
      const projectTitle = fields.projectTitle.value.trim() || "Impact pathway";

      board.innerHTML = "";

      boardLabels.forEach((label) => {
        const heading = document.createElement("div");
        heading.className = "board-stage-label";
        heading.style.left = `${typeConfig[label.type].left}px`;
        heading.style.width = "196px";
        heading.style.setProperty("--stage-color", typeConfig[label.type].color);
        heading.textContent = label.label;
        board.appendChild(heading);
      });

      const title = document.createElement("p");
      title.style.cssText = `
        position: absolute;
        left: 28px;
        bottom: 11px;
        margin: 0;
        color: var(--text-dim);
        font-size: 0.7rem;
        z-index: 1;
      `;
      title.textContent = shorten(projectTitle, 160);
      board.appendChild(title);

      if (!cards.length) {
        const empty = document.createElement("p");
        empty.style.cssText = `
          position: absolute;
          top: 48%;
          left: 50%;
          width: 520px;
          max-width: calc(100% - 2rem);
          transform: translate(-50%, -50%);
          margin: 0;
          color: var(--text-lo);
          font-size: 0.95rem;
          line-height: 1.6;
          text-align: center;
        `;
        empty.textContent =
          "Add a research finding, then connect stakeholders, activities, intended outcomes and evidence. Drag cards to shape the visual story.";
        board.appendChild(empty);
        updateInsights();
        return;
      }

      cards
        .filter((card) => card.connectTo)
        .forEach((card) => {
          const source = cards.find((item) => item.id === card.connectTo);

          if (!source) return;

          const start = cardCentre(source);
          const end = cardCentre(card);
          const deltaX = end.x - start.x;
          const deltaY = end.y - start.y;
          const length = Math.sqrt(deltaX ** 2 + deltaY ** 2);
          const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

          const isActive =
            selectedCardId === card.id || selectedCardId === source.id;
          const isDimmed = selectedCardId && !isActive;

          const link = document.createElement("div");
          link.className = `board-link${assumptionMode ? " assumption" : ""}${isActive ? " active" : ""}${isDimmed ? " dimmed" : ""}`;
          link.style.left = `${start.x}px`;
          link.style.top = `${start.y}px`;
          link.style.width = `${length}px`;
          link.style.transform = `rotate(${angle}deg)`;

          board.appendChild(link);
        });

      cards.forEach((card) => {
        const isSelected = card.id === selectedCardId;
        const isDimmed = selectedCardId && !isSelected;

        const element = document.createElement("article");
        element.className = `impact-card${isSelected ? " selected" : ""}${isDimmed ? " dimmed" : ""}`;
        element.dataset.id = card.id;
        element.dataset.type = card.type;
        element.tabIndex = 0;
        element.setAttribute(
          "aria-label",
          `${typeConfig[card.type].label}: ${card.title}. Click to show details.`
        );

        element.style.left = `${card.x}px`;
        element.style.top = `${card.y}px`;

        const assumptionText = assumptionMode
          ? `<span class="card-copy">${shorten(card.assumption || "No assumption or risk added.", 104)}</span>`
          : `<span class="card-copy">${shorten(card.description || "No description added.", 104)}</span>`;

        element.innerHTML = `
          <span class="card-type">${typeConfig[card.type].label}</span>
          <strong class="card-title">${shorten(card.title, 54)}</strong>
          ${assumptionText}
          <span class="card-status">${statusConfig[card.status]}</span>
        `;

        element.addEventListener("click", (event) => {
          if (dragging?.hasMoved) return;
          event.stopPropagation();
          const item = cards.find((current) => current.id === card.id);
          if (item) selectCard(item);
        });

        element.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            const item = cards.find((current) => current.id === card.id);
            if (item) selectCard(item);
          }
        });

        element.addEventListener("pointerdown", (event) => {
          const item = cards.find((current) => current.id === card.id);
          if (!item) return;

          element.setPointerCapture(event.pointerId);

          dragging = {
            id: card.id,
            startX: event.clientX,
            startY: event.clientY,
            originalX: item.x,
            originalY: item.y,
            hasMoved: false
          };
        });

        element.addEventListener("pointermove", (event) => {
          if (!dragging || dragging.id !== card.id) return;

          const item = cards.find((current) => current.id === card.id);
          if (!item) return;

          const dx = event.clientX - dragging.startX;
          const dy = event.clientY - dragging.startY;

          if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
            dragging.hasMoved = true;
          }

          item.x = clamp(dragging.originalX + dx, 12, 972);
          item.y = clamp(dragging.originalY + dy, 62, 465);

          renderBoard();
        });

        const stopDrag = () => {
          if (dragging?.id === card.id) {
            window.setTimeout(() => {
              dragging = null;
            }, 0);
          }
        };

        element.addEventListener("pointerup", stopDrag);
        element.addEventListener("pointercancel", stopDrag);

        board.appendChild(element);
      });

      board.addEventListener(
        "click",
        () => {
          selectedCardId = null;
          renderBoard();
        },
        { once: true }
      );

      updateInsights();
    };

    const updateInsights = () => {
      const types = ["finding", "stakeholder", "activity", "outcome", "evidence"];
      const counts = Object.fromEntries(types.map((type) => [type, 0]));

      cards.forEach((card) => {
        counts[card.type] += 1;
      });

      const missing = types.filter((type) => counts[type] === 0);
      const evidenceCards = cards.filter((card) => card.type === "evidence");
      const activeEngagement = cards.filter(
        (card) =>
          card.type === "activity" &&
          (card.status === "active" ||
            card.status === "documented" ||
            card.status === "validated")
      );

      if (!cards.length) {
        insights.coverage.textContent =
          "Add cards to check whether the pathway runs from research to evidence.";
        insights.evidence.textContent =
          "Add evidence cards to make later impact claims traceable.";
        insights.engagement.textContent =
          "Add stakeholders and activities to identify whether engagement is being treated as a meaningful pathway.";
        insights.reviewList.innerHTML = "";
        return;
      }

      insights.coverage.innerHTML = missing.length
        ? `<strong>${types.length - missing.length} of 5 stages</strong> are represented. Consider whether the map needs: ${missing.map((type) => typeConfig[type].label.toLowerCase()).join(", ")}.`
        : "<strong>All five stages are represented.</strong> Check whether the links explain a credible route rather than a linear promise.";

      insights.evidence.innerHTML = evidenceCards.length
        ? `<strong>${evidenceCards.length} evidence card${evidenceCards.length === 1 ? "" : "s"}</strong> added. Ensure each records a specific source, timing and what it can—and cannot—support.`
        : "<strong>No evidence card has been added.</strong> Plan how you will document use, change, reach, significance and external corroboration before claiming impact.";

      insights.engagement.innerHTML = counts.stakeholder && counts.activity
        ? `<strong>${counts.stakeholder} stakeholder card${counts.stakeholder === 1 ? "" : "s"} and ${counts.activity} activity card${counts.activity === 1 ? "" : "s"}</strong> added. ${activeEngagement.length ? "At least one engagement activity is active or documented." : "Clarify which activities are genuinely two-way and how participants can influence the work."}`
        : "The pathway needs both a named stakeholder and an engagement activity; dissemination alone is not necessarily meaningful engagement.";

      const prompts = [
        "Which specific research finding underpins this pathway, and what are its limits or uncertainties?",
        "Who benefits, who decides, who may be affected, and how are those groups able to shape interpretation or action?",
        "Does the engagement activity involve listening, exchange, co-design or accountability—not only one-way dissemination?",
        "What needs to happen between the activity and the intended outcome, and what external conditions could disrupt that route?",
        "What evidence will show use, change, reach and significance rather than merely outputs, attendance or media coverage?",
        "Which claims are planned, which are documented, and which have independent external corroboration?"
      ];

      insights.reviewList.innerHTML = "";

      prompts.forEach((prompt) => {
        const item = document.createElement("li");
        item.innerHTML =
          `<span class="review-icon" aria-hidden="true">?</span><span>${prompt}</span>`;
        insights.reviewList.appendChild(item);
      });
    };

    const addCard = () => {
      const title = fields.title.value.trim();

      if (!title) {
        fields.title.focus();
        return;
      }

      const type = fields.type.value;
      const existingOfType = cards.filter((card) => card.type === type).length;

      const card = {
        id: createId(),
        type,
        status: fields.status.value,
        title,
        description: fields.description.value.trim(),
        owner: fields.owner.value.trim(),
        assumption: fields.assumption.value.trim(),
        connectTo: fields.connectTo.value,
        x: typeConfig[type].left,
        y: 92 + existingOfType * 164
      };

      cards.push(card);
      refreshConnectionOptions();
      selectCard(card);
      clearCardForm();
    };

    const loadDemo = (key) => {
      const demos = {
        "urban-heat": {
          title: "Urban heat and neighbourhood design",
          cards: [
            {
              type: "finding",
              status: "documented",
              title: "Urban heat pattern",
              description: "Lower tree canopy and more impervious surfaces are associated with higher daytime land surface temperatures in mapped Leicester neighbourhoods.",
              owner: "Research team",
              assumption: "The satellite and geographic indicators are interpreted within their spatial, temporal and methodological limits.",
              connectTo: null,
              x: 28,
              y: 202
            },
            {
              type: "stakeholder",
              status: "active",
              title: "Neighbourhood organisations",
              description: "Bring lived experience, local priorities and context that may not be visible in the geographic or satellite data.",
              owner: "Community partners",
              assumption: "Participation is accessible, representative enough for the purpose and can meaningfully shape the project.",
              connectTo: 0,
              x: 265,
              y: 160
            },
            {
              type: "activity",
              status: "planned",
              title: "Evidence workshops",
              description: "Use facilitated sessions to test interpretation, identify information gaps and develop locally meaningful questions and priorities.",
              owner: "Research team and community partners",
              assumption: "The process creates space for dialogue rather than treating consultation as one-way validation.",
              connectTo: 1,
              x: 500,
              y: 122
            },
            {
              type: "stakeholder",
              status: "active",
              title: "Local authority planning teams",
              description: "Interpret relevance to local planning, green infrastructure, public realm and climate-adaptation decisions.",
              owner: "Local authority and research team",
              assumption: "Teams have the capacity and authority to consider evidence within relevant decision processes.",
              connectTo: 0,
              x: 265,
              y: 354
            },
            {
              type: "activity",
              status: "planned",
              title: "Decision-ready map and briefing",
              description: "Develop accessible mapped evidence, caveats and practical briefing material shaped with intended users.",
              owner: "Research team and local authority partners",
              assumption: "The briefing is timely, understandable and sufficiently relevant to a live decision context.",
              connectTo: 3,
              x: 500,
              y: 330
            },
            {
              type: "outcome",
              status: "planned",
              title: "Better local prioritisation",
              description: "Partners have a clearer, more contextual evidence base for discussing heat exposure, green infrastructure and follow-up investigation.",
              owner: "Partner organisations",
              assumption: "Evidence is considered alongside policy, budget, equity, feasibility and local knowledge.",
              connectTo: 4,
              x: 735,
              y: 228
            },
            {
              type: "evidence",
              status: "planned",
              title: "Traceable evidence of use and change",
              description: "Capture meeting records, feedback, revised plans, documented decisions and independent partner accounts of research contribution.",
              owner: "Research team and evaluation partners",
              assumption: "Partners agree to document use and follow-up, including outcomes that are limited or unexpected.",
              connectTo: 5,
              x: 970,
              y: 228
            }
          ]
        },

        "coastal-monitoring": {
          title: "Satellite coastal monitoring",
          cards: [
            {
              type: "finding",
              status: "documented",
              title: "Visible coastal change indicators",
              description: "Multi-date imagery identifies visible changes that may warrant additional local investigation and ground validation.",
              owner: "Remote-sensing research team",
              assumption: "Image resolution, tides, cloud cover and classification limits are clearly communicated.",
              connectTo: null,
              x: 28,
              y: 220
            },
            {
              type: "stakeholder",
              status: "active",
              title: "Coastal authority officers",
              description: "Can use evidence to inform where to prioritise follow-up observation, survey or cross-agency discussion.",
              owner: "Coastal authority",
              assumption: "The authority has a relevant decision window and can integrate evidence with statutory and technical processes.",
              connectTo: 0,
              x: 265,
              y: 220
            },
            {
              type: "activity",
              status: "active",
              title: "Interpretation and validation workshop",
              description: "Review satellite observations with coastal officers, environmental specialists and local knowledge holders.",
              owner: "Research team and coastal partners",
              assumption: "The workshop includes relevant expertise and does not treat imagery as a substitute for ground evidence.",
              connectTo: 1,
              x: 500,
              y: 220
            },
            {
              type: "outcome",
              status: "planned",
              title: "More targeted monitoring plan",
              description: "The evidence contributes to a transparent prioritisation process for additional monitoring or investigation.",
              owner: "Coastal authority and partners",
              assumption: "Resources are available to act on agreed priorities.",
              connectTo: 2,
              x: 735,
              y: 220
            },
            {
              type: "evidence",
              status: "planned",
              title: "Decision and implementation records",
              description: "Maintain dated plans, meeting notes, monitoring decisions, partner testimony and evidence of subsequent follow-up.",
              owner: "Project evaluator",
              assumption: "The contribution of research can be documented distinctly from other influences.",
              connectTo: 3,
              x: 970,
              y: 220
            }
          ]
        },

        "research-policy": {
          title: "Research evidence to policy use",
          cards: [
            {
              type: "finding",
              status: "documented",
              title: "Policy-relevant research synthesis",
              description: "A synthesis identifies evidence and uncertainties relevant to a defined policy or service challenge.",
              owner: "Research team",
              assumption: "The synthesis is accurate, timely and relevant to the policy context.",
              connectTo: null,
              x: 28,
              y: 210
            },
            {
              type: "stakeholder",
              status: "active",
              title: "Policy and practice partners",
              description: "Offer context on implementation constraints, decision timing, evidence needs and potential unintended effects.",
              owner: "Policy partners and intermediaries",
              assumption: "Partners have time and incentives to engage in reciprocal discussion.",
              connectTo: 0,
              x: 265,
              y: 210
            },
            {
              type: "activity",
              status: "active",
              title: "Co-designed policy briefing",
              description: "Translate the evidence into an accessible briefing with limitations, scenarios, user questions and routes to technical support.",
              owner: "Research team and knowledge broker",
              assumption: "Co-design retains methodological integrity and does not remove important caveats.",
              connectTo: 1,
              x: 500,
              y: 210
            },
            {
              type: "outcome",
              status: "planned",
              title: "Improved evidence use",
              description: "Partners report increased confidence and capability to assess research evidence in relevant decisions.",
              owner: "Policy and practice partners",
              assumption: "Organisational conditions allow evidence to be considered alongside political, financial and operational factors.",
              connectTo: 2,
              x: 735,
              y: 210
            },
            {
              type: "evidence",
              status: "planned",
              title: "Independent corroboration",
              description: "Secure attributable testimony, decision records, document references and evaluation data on research contribution and resulting change.",
              owner: "Research team and independent evaluators",
              assumption: "Evidence can credibly distinguish research contribution from other drivers of change.",
              connectTo: 3,
              x: 970,
              y: 210
            }
          ]
        }
      };

      const demo = demos[key];
      if (!demo) return;

      fields.projectTitle.value = demo.title;

      const idMap = new Map();

      cards = demo.cards.map((card, index) => {
        const id = createId();
        idMap.set(index, id);

        return {
          ...card,
          id,
          connectTo: ""
        };
      });

      cards = cards.map((card, index) => ({
        ...card,
        connectTo:
          demo.cards[index].connectTo === null
            ? ""
            : idMap.get(demo.cards[index].connectTo)
      }));

      selectedCardId = cards[0]?.id || null;
      fields.demoPicker.value = key;

      refreshConnectionOptions();

      if (cards[0]) {
        selectCard(cards[0]);
      } else {
        renderBoard();
      }
    };

    const copyPathway = async () => {
      const projectTitle = fields.projectTitle.value.trim() || "Impact pathway";

      const typeOrder = ["finding", "stakeholder", "activity", "outcome", "evidence"];

      const lines = [
        "IMPACT PATHWAY CANVAS",
        "",
        `Project: ${projectTitle}`,
        "",
        "PATHWAY ITEMS"
      ];

      typeOrder.forEach((type) => {
        const group = cards.filter((card) => card.type === type);

        if (!group.length) return;

        lines.push("");
        lines.push(typeConfig[type].label.toUpperCase());

        group.forEach((card) => {
          const source = card.connectTo
            ? cards.find((item) => item.id === card.connectTo)
            : null;

          lines.push(`- ${card.title}`);
          lines.push(`  Status: ${statusConfig[card.status]}`);
          lines.push(`  Contribution: ${card.description || "Not added."}`);
          lines.push(`  Owner / partner: ${card.owner || "Not added."}`);
          lines.push(`  Assumption / risk: ${card.assumption || "Not added."}`);
          lines.push(`  Connected from: ${source ? source.title : "Start of pathway"}`);
        });
      });

      lines.push("");
      lines.push("PLANNING NOTE");
      lines.push(
        "This map represents a proposed contribution pathway. It should be reviewed with stakeholders, adapted as learning emerges, and supported by proportionate evidence before claims of impact are made."
      );

      const button = document.querySelector("#copy-pathway");
      const originalLabel = button.textContent;

      try {
        await navigator.clipboard.writeText(lines.join("\n"));
        button.textContent = "Pathway copied";
      } catch {
        button.textContent = "Copy unavailable";
      }

      window.setTimeout(() => {
        button.textContent = originalLabel;
      }, 1800);
    };

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      addCard();
    });

    fields.projectTitle.addEventListener("input", renderBoard);

    fields.demoPicker.addEventListener("change", (event) => {
      if (event.target.value) loadDemo(event.target.value);
    });

    document.querySelector("#clear-card").addEventListener("click", clearCardForm);
    document.querySelector("#copy-pathway").addEventListener("click", copyPathway);

    document.querySelector("#show-pathway").addEventListener("click", () => {
      assumptionMode = false;
      document.querySelector("#show-pathway").setAttribute("aria-pressed", "true");
      document.querySelector("#show-assumptions").setAttribute("aria-pressed", "false");
      renderBoard();
    });

    document.querySelector("#show-assumptions").addEventListener("click", () => {
      assumptionMode = true;
      document.querySelector("#show-pathway").setAttribute("aria-pressed", "false");
      document.querySelector("#show-assumptions").setAttribute("aria-pressed", "true");
      renderBoard();
    });

    loadDemo("urban-heat");

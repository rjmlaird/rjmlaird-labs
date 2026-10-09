const svg = document.querySelector("#constellation");
    const form = document.querySelector("#constellation-form");

    const fields = {
      researchTitle: document.querySelector("#research-title"),
      stakeholderName: document.querySelector("#stakeholder-name"),
      stakeholderPurpose: document.querySelector("#stakeholder-purpose"),
      influence: document.querySelector("#influence"),
      benefit: document.querySelector("#benefit"),
      involvement: document.querySelector("#involvement"),
      relationship: document.querySelector("#relationship"),
      engagementNeed: document.querySelector("#engagement-need"),
      exclusionRisk: document.querySelector("#exclusion-risk"),
      collaborationStatus: document.querySelector("#collaboration-status"),
      examplePicker: document.querySelector("#example-picker")
    };

    const rangeOutputs = {
      influence: document.querySelector("#influence-value"),
      benefit: document.querySelector("#benefit-value"),
      involvement: document.querySelector("#involvement-value"),
      relationship: document.querySelector("#relationship-value"),
      engagementNeed: document.querySelector("#engagement-need-value"),
      exclusionRisk: document.querySelector("#exclusion-risk-value")
    };

    const selected = {
      name: document.querySelector("#selected-name"),
      description: document.querySelector("#selected-description"),
      statusLabel: document.querySelector("#selected-status-label"),
      status: document.querySelector("#selected-status"),
      metrics: document.querySelector("#selected-metrics")
    };

    const insights = {
      highestPriority: document.querySelector("#highest-priority"),
      relationshipGap: document.querySelector("#relationship-gap"),
      inclusionPrompt: document.querySelector("#inclusion-prompt"),
      list: document.querySelector("#priority-list")
    };

    const dimensions = {
      influence: "Influence",
      benefit: "Benefit",
      involvement: "Involvement",
      relationship: "Relationship",
      engagementNeed: "Engagement",
      exclusionRisk: "Exclusion risk"
    };

    const statusConfig = {
      proposed: {
        label: "Proposed relationship",
        color: "#f4af31",
        dash: "9 8",
        description: "A relationship to explore. Confirm relevance, preferred contact routes and whether engagement is welcome."
      },
      consultation: {
        label: "Consultation needed",
        color: "#f4af31",
        dash: "9 8",
        description: "Consultation is needed before decisions or communication plans are finalised."
      },
      active: {
        label: "Active collaboration",
        color: "#00c2a8",
        dash: "",
        description: "An existing working relationship that can support dialogue, testing or shared learning."
      },
      "co-production": {
        label: "Co-production / shared decision-making",
        color: "#b6a0ff",
        dash: "2 7",
        description: "A shared process should recognise expertise, power dynamics, ownership and decision-making roles."
      }
    };

    const palette = ["#00c2a8", "#83adff", "#f4af31", "#b6a0ff", "#f18d8d", "#6fd0ea", "#9fd16b"];

    let stakeholders = [];
    let activeStakeholderId = null;
    let priorityMode = false;

    const demoConstellations = {
      "urban-heat": {
        research:
          "Urban heat research: lower tree canopy and more impervious surfaces are associated with higher daytime land surface temperatures in Leicester neighbourhoods.",
        stakeholders: [
          {
            name: "Local authority planners",
            purpose: "Can use the evidence to inform further investigation, planning conversations and possible green-infrastructure priorities.",
            influence: 5,
            benefit: 4,
            involvement: 4,
            relationship: 3,
            engagementNeed: 5,
            exclusionRisk: 4,
            status: "active"
          },
          {
            name: "Neighbourhood organisations",
            purpose: "Bring lived experience, local knowledge and priorities that may not be visible in satellite or geographic data.",
            influence: 3,
            benefit: 5,
            involvement: 4,
            relationship: 2,
            engagementNeed: 5,
            exclusionRisk: 5,
            status: "consultation"
          },
          {
            name: "Public-health teams",
            purpose: "Can help interpret the relevance of environmental indicators and identify where further health-focused evidence is needed.",
            influence: 5,
            benefit: 4,
            involvement: 3,
            relationship: 3,
            engagementNeed: 4,
            exclusionRisk: 4,
            status: "active"
          },
          {
            name: "Funders",
            purpose: "May enable follow-on validation, engagement and applied research, but should not determine community priorities alone.",
            influence: 4,
            benefit: 3,
            involvement: 2,
            relationship: 4,
            engagementNeed: 2,
            exclusionRisk: 2,
            status: "active"
          },
          {
            name: "Parks and green-space teams",
            purpose: "Can contribute operational insight about tree canopy, maintenance, delivery constraints and potential interventions.",
            influence: 4,
            benefit: 4,
            involvement: 4,
            relationship: 3,
            engagementNeed: 4,
            exclusionRisk: 3,
            status: "consultation"
          }
        ]
      },

      "air-quality": {
        research:
          "Air-quality forecasts combine modelling, satellite observations and local monitoring data to estimate expected short-term conditions.",
        stakeholders: [
          {
            name: "Public-health teams",
            purpose: "Provide guidance on responsible health communication and routes to established public-health advice.",
            influence: 5,
            benefit: 5,
            involvement: 5,
            relationship: 3,
            engagementNeed: 5,
            exclusionRisk: 5,
            status: "co-production"
          },
          {
            name: "Schools and youth organisations",
            purpose: "Can help test whether forecast language is understandable and usable for families, pupils and educators.",
            influence: 3,
            benefit: 4,
            involvement: 4,
            relationship: 2,
            engagementNeed: 5,
            exclusionRisk: 4,
            status: "consultation"
          },
          {
            name: "Community organisations",
            purpose: "Can identify communication barriers and groups more likely to be affected by poor air quality or limited information access.",
            influence: 3,
            benefit: 5,
            involvement: 4,
            relationship: 2,
            engagementNeed: 5,
            exclusionRisk: 5,
            status: "consultation"
          },
          {
            name: "Local media",
            purpose: "Can extend reach but need careful context to avoid overstating local precision or health implications.",
            influence: 4,
            benefit: 2,
            involvement: 2,
            relationship: 3,
            engagementNeed: 3,
            exclusionRisk: 2,
            status: "proposed"
          }
        ]
      },

      "coastal-monitoring": {
        research:
          "Multi-date satellite imagery can identify visible coastal changes and highlight locations that may warrant further investigation.",
        stakeholders: [
          {
            name: "Coastal authorities",
            purpose: "May use the analysis to prioritise locations for follow-up observation, subject to appropriate ground validation.",
            influence: 5,
            benefit: 5,
            involvement: 5,
            relationship: 3,
            engagementNeed: 5,
            exclusionRisk: 4,
            status: "active"
          },
          {
            name: "Coastal communities",
            purpose: "Bring place-based knowledge, lived experience and concerns that should shape interpretation and priorities.",
            influence: 3,
            benefit: 5,
            involvement: 4,
            relationship: 2,
            engagementNeed: 5,
            exclusionRisk: 5,
            status: "consultation"
          },
          {
            name: "Environmental agencies",
            purpose: "Can contribute monitoring expertise, environmental priorities and validation pathways.",
            influence: 5,
            benefit: 4,
            involvement: 4,
            relationship: 4,
            engagementNeed: 4,
            exclusionRisk: 3,
            status: "active"
          },
          {
            name: "Coastal partnerships",
            purpose: "Can connect organisations, coordinate dialogue and help turn evidence into appropriate collective action.",
            influence: 4,
            benefit: 4,
            involvement: 4,
            relationship: 3,
            engagementNeed: 4,
            exclusionRisk: 4,
            status: "co-production"
          }
        ]
      }
    };

    const score = (stakeholder) => {
      return (
        stakeholder.influence * 1.2 +
        stakeholder.benefit * 1.1 +
        stakeholder.involvement * 1.15 +
        stakeholder.engagementNeed * 1.35 +
        stakeholder.exclusionRisk * 1.45
      );
    };

    const relevance = (stakeholder) => {
      return (
        stakeholder.influence +
        stakeholder.benefit +
        stakeholder.involvement +
        stakeholder.engagementNeed +
        stakeholder.exclusionRisk
      ) / 5;
    };

    const relationshipDistance = (relationship) => {
      return 275 - relationship * 38;
    };

    const createId = () => {
      return `stakeholder-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    };

    const escapeXml = (value) => {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&apos;");
    };

    const truncate = (text, length) => {
      const clean = text.replace(/\s+/g, " ").trim();
      return clean.length > length ? `${clean.slice(0, length - 1)}…` : clean;
    };

    const updateRangeOutputs = () => {
      Object.entries(rangeOutputs).forEach(([key, output]) => {
        output.textContent = fields[key].value;
      });
    };

    const clearInputFields = () => {
      fields.stakeholderName.value = "";
      fields.stakeholderPurpose.value = "";
      fields.influence.value = 3;
      fields.benefit.value = 3;
      fields.involvement.value = 3;
      fields.relationship.value = 3;
      fields.engagementNeed.value = 3;
      fields.exclusionRisk.value = 3;
      fields.collaborationStatus.value = "proposed";
      updateRangeOutputs();
      fields.stakeholderName.focus();
    };

    const getNodePosition = (stakeholder, index, total) => {
      const centerX = 450;
      const centerY = 315;
      const relationshipRadius = relationshipDistance(stakeholder.relationship);
      const offset = total > 1 ? (index / total) * Math.PI * 2 : 0;
      const startAngle = -Math.PI / 2;
      const angle = startAngle + offset;

      return {
        x: centerX + Math.cos(angle) * relationshipRadius,
        y: centerY + Math.sin(angle) * relationshipRadius
      };
    };

    const showStakeholder = (stakeholder) => {
      activeStakeholderId = stakeholder.id;

      selected.name.textContent = stakeholder.name;
      selected.description.textContent = stakeholder.purpose || "No role description provided.";

      const status = statusConfig[stakeholder.status];
      selected.statusLabel.textContent = "Collaboration status:";
      selected.status.textContent = `${status.label}. ${status.description}`;

      selected.metrics.innerHTML = "";

      Object.entries(dimensions).forEach(([key, label]) => {
        const metric = document.createElement("div");
        metric.className = "metric";
        metric.innerHTML = `<small>${label}</small><strong>${stakeholder[key]} / 5</strong>`;
        selected.metrics.appendChild(metric);
      });

      renderConstellation();
    };

    const renderInsights = () => {
      const ordered = [...stakeholders].sort((a, b) => score(b) - score(a));
      const highPriority = ordered[0];

      if (!highPriority) {
        insights.highestPriority.textContent = "Add stakeholders to generate an engagement priority.";
        insights.relationshipGap.textContent = "Add stakeholders to identify groups that need trust-building.";
        insights.inclusionPrompt.textContent = "Add stakeholders to assess who may be harmed by exclusion.";
        insights.list.innerHTML = "";
        return;
      }

      const weakestRelationship = [...stakeholders]
        .filter((item) => item.engagementNeed >= 4 || item.exclusionRisk >= 4)
        .sort((a, b) => a.relationship - b.relationship)[0];

      const highestExclusionRisk = [...stakeholders]
        .filter((item) => item.exclusionRisk >= 4)
        .sort((a, b) => b.exclusionRisk - a.exclusionRisk)[0];

      insights.highestPriority.innerHTML =
        `<strong>${highPriority.name}</strong> has the highest combined priority score. Start by confirming the right engagement route and what meaningful involvement looks like.`;

      insights.relationshipGap.innerHTML = weakestRelationship
        ? `<strong>${weakestRelationship.name}</strong> has a high need for engagement but a relatively weak existing relationship. Prioritise trust-building before asking for input.`
        : "No high-engagement stakeholder currently shows a clear relationship-strength gap.";

      insights.inclusionPrompt.innerHTML = highestExclusionRisk
        ? `<strong>${highestExclusionRisk.name}</strong> has a high exclusion-risk score. Check barriers to participation, representation, power and whether engagement can influence decisions.`
        : "No stakeholder currently has a high exclusion-risk score. Recheck whether affected groups are missing.";

      insights.list.innerHTML = "";

      ordered.slice(0, 5).forEach((stakeholder, index) => {
        const status = statusConfig[stakeholder.status];
        const listItem = document.createElement("li");

        const rationale = [];

        if (stakeholder.exclusionRisk >= 4) rationale.push("high exclusion risk");
        if (stakeholder.engagementNeed >= 4) rationale.push("strong need for engagement");
        if (stakeholder.influence >= 4) rationale.push("significant decision influence");
        if (stakeholder.benefit >= 4) rationale.push("likely direct benefit");
        if (stakeholder.relationship <= 2) rationale.push("relationship needs development");

        listItem.innerHTML = `
          <span class="priority-index">${index + 1}</span>
          <span>
            <strong>${stakeholder.name}</strong> — ${rationale.join(", ") || "review scores and role"}.
            Current status: ${status.label.toLowerCase()}.
          </span>
        `;

        insights.list.appendChild(listItem);
      });
    };

    const renderConstellation = () => {
      const researchTitle =
        fields.researchTitle.value.trim() || "Research finding not yet added.";

      const centerX = 450;
      const centerY = 315;
      const centerRadius = 76;

      const visibleStakeholders = priorityMode
        ? stakeholders.filter((stakeholder) => score(stakeholder) >= 20)
        : stakeholders;

      const positionMap = new Map();

      visibleStakeholders.forEach((stakeholder, index) => {
        positionMap.set(
          stakeholder.id,
          getNodePosition(stakeholder, index, visibleStakeholders.length)
        );
      });

      const links = visibleStakeholders
        .map((stakeholder) => {
          const point = positionMap.get(stakeholder.id);
          const status = statusConfig[stakeholder.status];
          const isActive = stakeholder.id === activeStakeholderId;
          const className =
            activeStakeholderId && !isActive ? "constellation-link dimmed" : "constellation-link";

          return `
            <line
              class="${className}${isActive ? " active" : ""}"
              x1="${centerX}"
              y1="${centerY}"
              x2="${point.x}"
              y2="${point.y}"
              stroke="${status.color}"
              stroke-width="${isActive ? 3 : 2}"
              stroke-dasharray="${status.dash}"
              opacity="${isActive ? 0.95 : 0.72}"
            />
          `;
        })
        .join("");

      const nodeMarkup = visibleStakeholders
        .map((stakeholder, index) => {
          const point = positionMap.get(stakeholder.id);
          const status = statusConfig[stakeholder.status];
          const isActive = stakeholder.id === activeStakeholderId;
          const isDimmed = activeStakeholderId && !isActive;
          const radius = 28 + relevance(stakeholder) * 5.2;
          const number = index + 1;
          const labelY = point.y + radius + 19;
          const subLabelY = labelY + 14;

          return `
            <g
              class="constellation-node${isActive ? " active" : ""}${isDimmed ? " dimmed" : ""}"
              tabindex="0"
              role="button"
              aria-label="${escapeXml(stakeholder.name)}. Click to view stakeholder details."
              data-id="${stakeholder.id}"
            >
              <circle
                class="node-circle"
                cx="${point.x}"
                cy="${point.y}"
                r="${radius}"
                fill="${status.color}"
                fill-opacity="0.2"
                stroke="${status.color}"
              />
              <circle
                cx="${point.x}"
                cy="${point.y}"
                r="15"
                fill="${status.color}"
                opacity="0.96"
              />
              <text
                class="node-number"
                x="${point.x}"
                y="${point.y + 4}"
                text-anchor="middle"
              >${number}</text>
              <text
                class="node-label"
                x="${point.x}"
                y="${labelY}"
                text-anchor="middle"
              >${escapeXml(truncate(stakeholder.name, 28))}</text>
              <text
                class="node-sub-label"
                x="${point.x}"
                y="${subLabelY}"
                text-anchor="middle"
              >R ${relevance(stakeholder).toFixed(1)} · Rel ${stakeholder.relationship}/5</text>
            </g>
          `;
        })
        .join("");

      const emptyState = visibleStakeholders.length
        ? ""
        : `
          <text
            x="450"
            y="450"
            text-anchor="middle"
            fill="#a8b6c4"
            font-family="Inter, system-ui, sans-serif"
            font-size="14"
          >
            No stakeholder meets the priority filter yet.
          </text>
        `;

      svg.innerHTML = `
        <g aria-hidden="true">
          <circle cx="${centerX}" cy="${centerY}" r="166" fill="none" stroke="rgba(237,244,248,0.12)" stroke-dasharray="4 9" />
          <circle cx="${centerX}" cy="${centerY}" r="100" fill="none" stroke="rgba(0,194,168,0.22)" stroke-dasharray="3 8" />
          <text x="${centerX}" y="78" text-anchor="middle" fill="#748392" font-family="Inter, system-ui, sans-serif" font-size="11">
            Closer to centre = stronger existing relationship
          </text>
        </g>

        <g class="constellation-links">${links}</g>

        <g class="research-node">
          <circle
            cx="${centerX}"
            cy="${centerY}"
            r="${centerRadius}"
            fill="#00c2a8"
            fill-opacity="0.18"
            stroke="#00c2a8"
            stroke-width="2.5"
          />
          <circle
            cx="${centerX}"
            cy="${centerY}"
            r="29"
            fill="#00c2a8"
            fill-opacity="0.96"
          />
          <text x="${centerX}" y="${centerY + 5}" text-anchor="middle" fill="#08111d" font-family="Space Grotesk, sans-serif" font-size="15" font-weight="700">
            Research
          </text>
          <text class="centre-label" x="${centerX}" y="${centerY + 97}" text-anchor="middle">
            Research finding
          </text>
          <text class="centre-sub-label" x="${centerX}" y="${centerY + 114}" text-anchor="middle">
            ${escapeXml(truncate(researchTitle, 88))}
          </text>
        </g>

        <g class="constellation-nodes">${nodeMarkup}</g>
        ${emptyState}
      `;

      svg.querySelectorAll(".constellation-node").forEach((node) => {
        const openNode = () => {
          const stakeholder = stakeholders.find((item) => item.id === node.dataset.id);
          if (stakeholder) showStakeholder(stakeholder);
        };

        node.addEventListener("click", openNode);
        node.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openNode();
          }
        });
      });

      renderInsights();
    };

    const addStakeholder = () => {
      const name = fields.stakeholderName.value.trim();

      if (!name) {
        fields.stakeholderName.focus();
        return;
      }

      const stakeholder = {
        id: createId(),
        name,
        purpose: fields.stakeholderPurpose.value.trim() || "No description added.",
        influence: Number(fields.influence.value),
        benefit: Number(fields.benefit.value),
        involvement: Number(fields.involvement.value),
        relationship: Number(fields.relationship.value),
        engagementNeed: Number(fields.engagementNeed.value),
        exclusionRisk: Number(fields.exclusionRisk.value),
        status: fields.collaborationStatus.value
      };

      stakeholders.push(stakeholder);
      showStakeholder(stakeholder);
      clearInputFields();
    };

    const loadDemo = (key) => {
      const demo = demoConstellations[key];
      if (!demo) return;

      fields.researchTitle.value = demo.research;
      stakeholders = demo.stakeholders.map((stakeholder) => ({
        ...stakeholder,
        id: createId()
      }));

      activeStakeholderId = stakeholders[0]?.id || null;
      fields.examplePicker.value = key;

      if (stakeholders[0]) {
        showStakeholder(stakeholders[0]);
      } else {
        renderConstellation();
      }
    };

    const copyPriorities = async () => {
      const ordered = [...stakeholders].sort((a, b) => score(b) - score(a));
      const researchTitle =
        fields.researchTitle.value.trim() || "Research finding not yet added.";

      const text = [
        "STAKEHOLDER CONSTELLATION — ENGAGEMENT PRIORITIES",
        "",
        "RESEARCH FINDING",
        researchTitle,
        "",
        "STAKEHOLDER PRIORITIES",
        ...ordered.map((stakeholder, index) => {
          const status = statusConfig[stakeholder.status].label;
          return [
            `${index + 1}. ${stakeholder.name}`,
            `Why they matter: ${stakeholder.purpose}`,
            `Scores: Influence ${stakeholder.influence}/5; Benefit ${stakeholder.benefit}/5; Involvement ${stakeholder.involvement}/5; Relationship ${stakeholder.relationship}/5; Engagement need ${stakeholder.engagementNeed}/5; Exclusion risk ${stakeholder.exclusionRisk}/5.`,
            `Status: ${status}`,
            ""
          ].join("\n");
        }),
        "PLANNING NOTE",
        "This map is a planning prompt, not proof of representation, consent, legitimacy or ethical adequacy. Validate priorities with relevant stakeholders and affected communities."
      ].join("\n");

      const button = document.querySelector("#copy-map");
      const originalLabel = button.textContent;

      try {
        await navigator.clipboard.writeText(text);
        button.textContent = "Priorities copied";
      } catch {
        button.textContent = "Copy unavailable";
      }

      window.setTimeout(() => {
        button.textContent = originalLabel;
      }, 1800);
    };

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      addStakeholder();
    });

    Object.values(fields).forEach((field) => {
      if (field.type === "range") {
        field.addEventListener("input", updateRangeOutputs);
      }
    });

    fields.researchTitle.addEventListener("input", renderConstellation);

    fields.examplePicker.addEventListener("change", (event) => {
      if (event.target.value) loadDemo(event.target.value);
    });

    document.querySelector("#clear-form").addEventListener("click", clearInputFields);

    document.querySelector("#copy-map").addEventListener("click", copyPriorities);

    document.querySelector("#show-all").addEventListener("click", () => {
      priorityMode = false;
      document.querySelector("#show-all").setAttribute("aria-pressed", "true");
      document.querySelector("#show-priority").setAttribute("aria-pressed", "false");
      renderConstellation();
    });

    document.querySelector("#show-priority").addEventListener("click", () => {
      priorityMode = true;
      document.querySelector("#show-all").setAttribute("aria-pressed", "false");
      document.querySelector("#show-priority").setAttribute("aria-pressed", "true");
      renderConstellation();
    });

    updateRangeOutputs();
    loadDemo("urban-heat");

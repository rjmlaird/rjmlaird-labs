const svg = document.querySelector("#toc-diagram");
    const form = document.querySelector("#toc-form");

    const fields = {
      programmeTitle: document.querySelector("#programme-title"),
      nodeType: document.querySelector("#node-type"),
      timeframe: document.querySelector("#timeframe"),
      nodeTitle: document.querySelector("#node-title"),
      nodeDescription: document.querySelector("#node-description"),
      nodeEvidence: document.querySelector("#node-evidence"),
      nodeAssumption: document.querySelector("#node-assumption"),
      connectTo: document.querySelector("#connect-to"),
      examplePicker: document.querySelector("#example-picker")
    };

    const detail = {
      title: document.querySelector("#detail-title"),
      description: document.querySelector("#detail-description"),
      type: document.querySelector("#detail-type"),
      timeframe: document.querySelector("#detail-timeframe"),
      evidence: document.querySelector("#detail-evidence"),
      assumption: document.querySelector("#detail-assumption")
    };

    const insights = {
      completeness: document.querySelector("#completeness-insight"),
      evidence: document.querySelector("#evidence-insight"),
      assumptions: document.querySelector("#assumption-insight"),
      reviews: document.querySelector("#review-list")
    };

    const stageConfig = {
      input: {
        label: "Input",
        plural: "Inputs",
        color: "#7da9ff",
        column: 0,
        description: "Resources, expertise, partnerships, funding, data or assets needed to enable the programme."
      },
      activity: {
        label: "Activity",
        plural: "Activities",
        color: "#00c2a8",
        column: 1,
        description: "Actions the programme undertakes: research, co-design, engagement, delivery or implementation."
      },
      output: {
        label: "Output",
        plural: "Outputs",
        color: "#b39cff",
        column: 2,
        description: "Direct deliverables, services, resources, events, evidence products or capabilities produced."
      },
      outcome: {
        label: "Outcome",
        plural: "Outcomes",
        color: "#f4af31",
        column: 3,
        description: "Short-, medium- or longer-term changes in knowledge, capacity, decisions, practice or systems."
      },
      impact: {
        label: "Impact",
        plural: "Impact",
        color: "#58d08b",
        column: 4,
        description: "The wider intended social, environmental, economic, cultural or policy benefit beyond direct delivery."
      }
    };

    let nodes = [];
    let activeNodeId = null;
    let assumptionMode = false;

    const createId = () => `node-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const escapeXml = (value) =>
      String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&apos;");

    const shorten = (text, length) => {
      const clean = String(text).replace(/\s+/g, " ").trim();
      return clean.length > length ? `${clean.slice(0, length - 1)}…` : clean;
    };

    const splitText = (text, maxLength = 29) => {
      const words = String(text).split(/\s+/);
      const lines = [];
      let current = "";

      words.forEach((word) => {
        const next = `${current} ${word}`.trim();

        if (next.length > maxLength && current) {
          lines.push(current);
          current = word;
        } else {
          current = next;
        }
      });

      if (current) lines.push(current);
      return lines.slice(0, 3);
    };

    const setNodeFormDefaults = () => {
      fields.nodeType.value = "activity";
      fields.timeframe.value = "0–6 months";
      fields.nodeTitle.value = "";
      fields.nodeDescription.value = "";
      fields.nodeEvidence.value = "";
      fields.nodeAssumption.value = "";
      fields.connectTo.value = "";
      fields.nodeTitle.focus();
    };

    const refreshConnectionOptions = () => {
      const currentValue = fields.connectTo.value;

      fields.connectTo.innerHTML = `<option value="">Start a new pathway</option>`;

      [...nodes]
        .sort((a, b) => stageConfig[a.type].column - stageConfig[b.type].column)
        .forEach((node) => {
          const option = document.createElement("option");
          option.value = node.id;
          option.textContent = `${stageConfig[node.type].label}: ${shorten(node.title, 52)}`;
          fields.connectTo.appendChild(option);
        });

      if (nodes.some((node) => node.id === currentValue)) {
        fields.connectTo.value = currentValue;
      }
    };

    const selectNode = (node) => {
      activeNodeId = node.id;

      detail.title.textContent = node.title;
      detail.description.textContent = node.description || stageConfig[node.type].description;
      detail.type.textContent = stageConfig[node.type].label;
      detail.timeframe.textContent = node.timeframe || "Not specified";
      detail.evidence.textContent = node.evidence || "No evidence indicator added.";
      detail.assumption.textContent = node.assumption || "No critical assumption added.";

      renderDiagram();
    };

    const generateLayout = () => {
      const columns = {
        input: [],
        activity: [],
        output: [],
        outcome: [],
        impact: []
      };

      nodes.forEach((node) => columns[node.type].push(node));

      const layout = new Map();
      const xPositions = {
        input: 125,
        activity: 350,
        output: 580,
        outcome: 810,
        impact: 1035
      };

      Object.entries(columns).forEach(([type, items]) => {
        const count = items.length;
        const gap = 126;
        const startY = 285 - ((count - 1) * gap) / 2;

        items.forEach((node, index) => {
          layout.set(node.id, {
            x: xPositions[type],
            y: startY + index * gap
          });
        });
      });

      return layout;
    };

    const renderDiagram = () => {
      const programmeTitle =
        fields.programmeTitle.value.trim() || "Theory of change pathway";

      if (!nodes.length) {
        svg.innerHTML = `
          <text x="580" y="255" text-anchor="middle" class="empty-diagram-copy">
            Add your first input, activity, output, outcome or impact node.
          </text>
          <text x="580" y="282" text-anchor="middle" class="empty-diagram-copy">
            Connect nodes to make the proposed pathway explicit.
          </text>
        `;
        updateInsights();
        return;
      }

      const layout = generateLayout();

      const columnLabels = Object.entries(stageConfig)
        .map(([type, config]) => {
          const positions = {
            input: 125,
            activity: 350,
            output: 580,
            outcome: 810,
            impact: 1035
          };

          return `
            <text
              x="${positions[type]}"
              y="37"
              text-anchor="middle"
              fill="${config.color}"
              font-family="Space Grotesk, sans-serif"
              font-size="12"
              font-weight="700"
              letter-spacing="1.2"
            >${config.plural.toUpperCase()}</text>
          `;
        })
        .join("");

      const links = nodes
        .filter((node) => node.connectTo && layout.has(node.connectTo))
        .map((node) => {
          const from = layout.get(node.connectTo);
          const to = layout.get(node.id);
          const isActive =
            activeNodeId === node.id || activeNodeId === node.connectTo;
          const isDimmed = activeNodeId && !isActive;
          const strokeColor = assumptionMode ? "#f08c8c" : "#a8b6c4";
          const dash = assumptionMode ? "7 8" : "";

          return `
            <path
              class="diagram-link${isActive ? " active" : ""}${isDimmed ? " dimmed" : ""}"
              d="M ${from.x + 86} ${from.y}
                 C ${from.x + 130} ${from.y},
                   ${to.x - 130} ${to.y},
                   ${to.x - 86} ${to.y}"
              fill="none"
              stroke="${strokeColor}"
              stroke-width="2.2"
              stroke-dasharray="${dash}"
              marker-end="url(#arrowhead)"
            />
          `;
        })
        .join("");

      const nodeMarkup = nodes
        .map((node) => {
          const point = layout.get(node.id);
          const config = stageConfig[node.type];
          const isActive = node.id === activeNodeId;
          const isDimmed = activeNodeId && !isActive;
          const titleLines = splitText(node.title);
          const copyLines = splitText(node.description || config.description, 32);
          const titleStartY = point.y - 22;
          const copyStartY = point.y + 23;
          const hasAssumption = Boolean(node.assumption.trim());

          return `
            <g
              class="diagram-node${isActive ? " active" : ""}${isDimmed ? " dimmed" : ""}"
              tabindex="0"
              role="button"
              aria-label="${escapeXml(config.label)}: ${escapeXml(node.title)}. Click for details."
              data-id="${node.id}"
            >
              <rect
                x="${point.x - 86}"
                y="${point.y - 56}"
                width="172"
                height="112"
                rx="12"
                fill="${config.color}"
                fill-opacity="0.12"
                stroke="${config.color}"
                stroke-width="2"
              />
              <text
                class="node-type"
                x="${point.x - 70}"
                y="${point.y - 36}"
              >${config.label.toUpperCase()}</text>

              ${titleLines
                .map(
                  (line, index) => `
                    <text class="node-title" x="${point.x - 70}" y="${titleStartY + index * 15}">
                      ${escapeXml(line)}
                    </text>
                  `
                )
                .join("")}

              ${copyLines
                .map(
                  (line, index) => `
                    <text class="node-copy" x="${point.x - 70}" y="${copyStartY + index * 13}">
                      ${escapeXml(line)}
                    </text>
                  `
                )
                .join("")}

              <text
                class="node-status"
                x="${point.x - 70}"
                y="${point.y + 42}"
                fill="${hasAssumption ? "#f4af31" : config.color}"
              >${hasAssumption ? "ASSUMPTION NOTED" : "INDICATOR READY"}</text>
            </g>
          `;
        })
        .join("");

      svg.innerHTML = `
        <defs>
          <marker
            id="arrowhead"
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="4"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M 0 0 L 8 4 L 0 8 z" fill="${assumptionMode ? "#f08c8c" : "#a8b6c4"}"></path>
          </marker>
        </defs>

        <g aria-hidden="true">
          ${columnLabels}
          <line x1="235" y1="57" x2="235" y2="540" stroke="rgba(237,244,248,0.08)" />
          <line x1="465" y1="57" x2="465" y2="540" stroke="rgba(237,244,248,0.08)" />
          <line x1="695" y1="57" x2="695" y2="540" stroke="rgba(237,244,248,0.08)" />
          <line x1="925" y1="57" x2="925" y2="540" stroke="rgba(237,244,248,0.08)" />
        </g>

        <g class="diagram-links">${links}</g>
        <g class="diagram-nodes">${nodeMarkup}</g>

        <text
          x="24"
          y="548"
          fill="#748392"
          font-family="Inter, system-ui, sans-serif"
          font-size="10"
        >${escapeXml(shorten(programmeTitle, 155))}</text>
      `;

      svg.querySelectorAll(".diagram-node").forEach((element) => {
        const openNode = () => {
          const node = nodes.find((item) => item.id === element.dataset.id);
          if (node) selectNode(node);
        };

        element.addEventListener("click", openNode);

        element.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openNode();
          }
        });
      });

      updateInsights();
    };

    const updateInsights = () => {
      const stageOrder = ["input", "activity", "output", "outcome", "impact"];
      const counts = Object.fromEntries(stageOrder.map((type) => [type, 0]));

      nodes.forEach((node) => {
        counts[node.type] += 1;
      });

      const populatedStages = stageOrder.filter((type) => counts[type] > 0);
      const missingStages = stageOrder.filter((type) => counts[type] === 0);

      if (!nodes.length) {
        insights.completeness.textContent =
          "Add nodes to assess coverage from inputs through to impact.";
        insights.evidence.textContent =
          "Add indicators to reveal which parts of the theory can be monitored.";
        insights.assumptions.textContent =
          "Add dependencies to identify what should be tested rather than assumed.";
        insights.reviews.innerHTML = "";
        return;
      }

      insights.completeness.innerHTML =
        missingStages.length
          ? `<strong>${populatedStages.length} of 5 stages</strong> currently covered. Consider whether the pathway needs: ${missingStages.map((type) => stageConfig[type].plural.toLowerCase()).join(", ")}.`
          : "<strong>All five stages are represented.</strong> Check whether each connection is plausible, specific and proportionate to the proposed scale.";

      const nodesWithEvidence = nodes.filter((node) => node.evidence.trim()).length;
      insights.evidence.innerHTML =
        `<strong>${nodesWithEvidence} of ${nodes.length} nodes</strong> have an evidence indicator. Add measures for both delivery and meaningful changes, not only outputs or reach.`;

      const nodesWithAssumptions = nodes.filter((node) => node.assumption.trim()).length;
      const noConnections = nodes.filter((node) => !node.connectTo).length;

      insights.assumptions.innerHTML =
        `<strong>${nodesWithAssumptions} of ${nodes.length} nodes</strong> include an explicit assumption. ${noConnections > 1 ? "Multiple unconnected pathways are present; check whether they are intended." : "Review power, feasibility, context and dependencies at each link."}`;

      const reviewers = [
        "What specific problem or opportunity is the programme trying to change, and for whom?",
        "Does every output have a credible route to an outcome, rather than assuming that delivery alone creates change?",
        "Which stakeholders are involved in interpreting needs, designing activities and judging whether change is meaningful?",
        "What assumptions, external conditions, risks or power dynamics could disrupt the pathway?",
        "How will you monitor delivery, learn during implementation and adapt if expected outcomes do not emerge?",
        "Which changes are realistically measurable during the funding period, and which are longer-term intended contributions?"
      ];

      insights.reviews.innerHTML = "";
      reviewers.forEach((review) => {
        const item = document.createElement("li");
        item.innerHTML =
          `<span class="review-icon" aria-hidden="true">?</span><span>${review}</span>`;
        insights.reviews.appendChild(item);
      });
    };

    const addNode = () => {
      const title = fields.nodeTitle.value.trim();

      if (!title) {
        fields.nodeTitle.focus();
        return;
      }

      const node = {
        id: createId(),
        type: fields.nodeType.value,
        timeframe: fields.timeframe.value,
        title,
        description: fields.nodeDescription.value.trim(),
        evidence: fields.nodeEvidence.value.trim(),
        assumption: fields.nodeAssumption.value.trim(),
        connectTo: fields.connectTo.value
      };

      nodes.push(node);
      refreshConnectionOptions();
      selectNode(node);
      setNodeFormDefaults();
    };

    const loadDemo = (key) => {
      const demos = {
        "urban-heat": {
          title: "Cooler neighbourhoods: evidence, engagement and green infrastructure",
          nodes: [
            {
              type: "input",
              timeframe: "0–6 months",
              title: "Research funding, EO data and local partnerships",
              description: "Funding, satellite-derived heat indicators, geographic data, research expertise and relationships with local organisations.",
              evidence: "Award confirmation, data catalogue, partner agreements, ethics and governance approvals.",
              assumption: "Data is sufficiently relevant and accessible for the local questions being explored.",
              connectTo: null
            },
            {
              type: "activity",
              timeframe: "0–6 months",
              title: "Neighbourhood climate evidence workshops",
              description: "Bring satellite-derived heat evidence together with local knowledge, lived experience and practitioner expertise.",
              evidence: "Workshop records, attendance diversity, accessible materials, feedback and agreed priorities.",
              assumption: "Participants can access the process and have a meaningful ability to influence interpretation.",
              connectTo: 0
            },
            {
              type: "output",
              timeframe: "6–12 months",
              title: "Shared heat-risk maps and action briefs",
              description: "Produce accessible maps, plain-language explainers and locally relevant decision briefs.",
              evidence: "Published resources, usability testing, partner review and distribution records.",
              assumption: "Materials are understandable, timely and appropriate for intended users.",
              connectTo: 1
            },
            {
              type: "outcome",
              timeframe: "1–2 years",
              title: "Improved local decision capability",
              description: "Partners have a stronger evidence base and shared language for considering heat, green infrastructure and adaptation priorities.",
              evidence: "Partner feedback, meeting records, strategy references, changed planning or engagement practice.",
              assumption: "Decision-makers have scope, resources and authority to act on relevant evidence.",
              connectTo: 2
            },
            {
              type: "impact",
              timeframe: "2–5 years",
              title: "More equitable heat-resilience planning",
              description: "The programme contributes to better-informed and more inclusive approaches to reducing heat-related risk in local neighbourhoods.",
              evidence: "Independent evaluation, implementation evidence, beneficiary experience and evidence of sustained policy or practice change.",
              assumption: "Longer-term investment, delivery capacity and wider policy conditions support implementation.",
              connectTo: 3
            }
          ]
        },

        "coastal-monitoring": {
          title: "Satellite coastal monitoring for resilient local decision-making",
          nodes: [
            {
              type: "input",
              timeframe: "0–6 months",
              title: "Remote-sensing expertise and coastal partnerships",
              description: "Access to image archives, analytical capacity, local coastal knowledge and delivery partners.",
              evidence: "Data-access plan, collaboration agreements and technical protocol.",
              assumption: "Satellite data can complement rather than replace ground-based assessment.",
              connectTo: null
            },
            {
              type: "activity",
              timeframe: "0–6 months",
              title: "Analyse visible coastal change over time",
              description: "Compare multi-date imagery and combine it with local observations to identify locations for further investigation.",
              evidence: "Methods documentation, quality checks and interpretation workshops.",
              assumption: "Tidal conditions, cloud cover and spatial resolution are sufficiently understood.",
              connectTo: 0
            },
            {
              type: "output",
              timeframe: "6–12 months",
              title: "Prioritised monitoring map",
              description: "Create a transparent map and briefing that identifies potential areas for follow-up, not definitive risk conclusions.",
              evidence: "Published map, metadata, user testing and partner briefing records.",
              assumption: "Users understand the map's limitations and do not interpret it as a legal or engineering assessment.",
              connectTo: 1
            },
            {
              type: "outcome",
              timeframe: "1–2 years",
              title: "Better targeted follow-up monitoring",
              description: "Authorities and partners use the evidence to inform where to conduct ground survey, discussion or additional monitoring.",
              evidence: "Meeting records, monitoring plans and decisions citing the evidence.",
              assumption: "Partners have resource and authority to undertake further monitoring.",
              connectTo: 2
            },
            {
              type: "impact",
              timeframe: "2–5 years",
              title: "More informed coastal resilience decisions",
              description: "The programme contributes to more timely, transparent and evidence-aware local resilience planning.",
              evidence: "External review, documented decision changes and evidence of implementation or improved readiness.",
              assumption: "Research contribution is assessed alongside engineering, community and policy considerations.",
              connectTo: 3
            }
          ]
        },

        "research-engagement": {
          title: "Research engagement pathway for policy-relevant climate evidence",
          nodes: [
            {
              type: "input",
              timeframe: "0–6 months",
              title: "Research findings and stakeholder network",
              description: "Peer-reviewed work, policy context, researcher time, communications resource and trusted intermediary relationships.",
              evidence: "Research outputs, stakeholder analysis and engagement plan.",
              assumption: "The research question and findings are relevant to a live policy or practice need.",
              connectTo: null
            },
            {
              type: "activity",
              timeframe: "0–6 months",
              title: "Co-designed evidence conversations",
              description: "Run structured discussions with policy, practitioner and community partners to interpret relevance, constraints and uncertainties.",
              evidence: "Facilitation records, participant feedback, decision logs and revised materials.",
              assumption: "Engagement is reciprocal rather than a one-way dissemination exercise.",
              connectTo: 0
            },
            {
              type: "output",
              timeframe: "6–12 months",
              title: "Decision-ready evidence products",
              description: "Create concise briefings, visual explainers, data notes and routes to further support.",
              evidence: "Accessible publications, downloads, partner approval and documented dissemination.",
              assumption: "Products meet user needs and retain necessary caveats and methodological context.",
              connectTo: 1
            },
            {
              type: "outcome",
              timeframe: "1–2 years",
              title: "Increased evidence use and capability",
              description: "Partners report greater confidence in interpreting and applying research within their decision processes.",
              evidence: "Interviews, citations, meeting minutes, decision records and before/after capability measures.",
              assumption: "Organisational incentives and capacity support evidence-informed decision-making.",
              connectTo: 2
            },
            {
              type: "impact",
              timeframe: "2–5 years",
              title: "More evidence-informed public decisions",
              description: "Research contributes to better designed, better targeted or more accountable policy and service decisions.",
              evidence: "External corroboration, evaluation findings, documented beneficiary outcomes and long-term follow-up.",
              assumption: "The contribution of research can be distinguished honestly from other influences.",
              connectTo: 3
            }
          ]
        }
      };

      const demo = demos[key];
      if (!demo) return;

      fields.programmeTitle.value = demo.title;

      const idMap = new Map();

      nodes = demo.nodes.map((node, index) => {
        const id = createId();
        idMap.set(index, id);

        return {
          ...node,
          id,
          connectTo: null
        };
      });

      nodes = nodes.map((node, index) => ({
        ...node,
        connectTo:
          demo.nodes[index].connectTo === null
            ? ""
            : idMap.get(demo.nodes[index].connectTo)
      }));

      activeNodeId = nodes[0]?.id || null;
      fields.examplePicker.value = key;

      refreshConnectionOptions();

      if (nodes[0]) {
        selectNode(nodes[0]);
      } else {
        renderDiagram();
      }
    };

    const copyTheory = async () => {
      const title = fields.programmeTitle.value.trim() || "Theory of Change";
      const order = ["input", "activity", "output", "outcome", "impact"];

      const lines = [
        "THEORY OF CHANGE",
        "",
        `Programme: ${title}`,
        "",
        "PATHWAY"
      ];

      order.forEach((type) => {
        const group = nodes.filter((node) => node.type === type);

        if (!group.length) return;

        lines.push("");
        lines.push(stageConfig[type].plural.toUpperCase());

        group.forEach((node) => {
          const parent = node.connectTo
            ? nodes.find((item) => item.id === node.connectTo)
            : null;

          lines.push(`- ${node.title}`);
          lines.push(`  Description: ${node.description || "Not added."}`);
          lines.push(`  Timeframe: ${node.timeframe || "Not specified."}`);
          lines.push(`  Evidence / indicator: ${node.evidence || "Not added."}`);
          lines.push(`  Critical assumption: ${node.assumption || "Not added."}`);
          lines.push(`  Connected from: ${parent ? parent.title : "Start of pathway"}`);
        });
      });

      lines.push("");
      lines.push("PLANNING NOTE");
      lines.push(
        "This theory of change is a testable hypothesis. It should be reviewed with stakeholders, supported by monitoring and evaluation, and updated as evidence emerges."
      );

      const text = lines.join("\n");
      const button = document.querySelector("#copy-summary");
      const originalLabel = button.textContent;

      try {
        await navigator.clipboard.writeText(text);
        button.textContent = "Theory copied";
      } catch {
        button.textContent = "Copy unavailable";
      }

      window.setTimeout(() => {
        button.textContent = originalLabel;
      }, 1800);
    };

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      addNode();
    });

    fields.programmeTitle.addEventListener("input", renderDiagram);

    fields.examplePicker.addEventListener("change", (event) => {
      if (event.target.value) loadDemo(event.target.value);
    });

    document.querySelector("#clear-node").addEventListener("click", setNodeFormDefaults);

    document.querySelector("#copy-summary").addEventListener("click", copyTheory);

    document.querySelector("#show-pathway").addEventListener("click", () => {
      assumptionMode = false;
      document.querySelector("#show-pathway").setAttribute("aria-pressed", "true");
      document.querySelector("#show-assumptions").setAttribute("aria-pressed", "false");
      renderDiagram();
    });

    document.querySelector("#show-assumptions").addEventListener("click", () => {
      assumptionMode = true;
      document.querySelector("#show-pathway").setAttribute("aria-pressed", "false");
      document.querySelector("#show-assumptions").setAttribute("aria-pressed", "true");
      renderDiagram();
    });

    loadDemo("urban-heat");

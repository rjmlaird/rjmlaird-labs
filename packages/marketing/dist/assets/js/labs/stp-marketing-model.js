const form = document.querySelector("#stp-form");

    const fields = {
      offerName: document.querySelector("#offer-name"),
      stage: document.querySelector("#planning-stage"),
      segmentName: document.querySelector("#segment-name"),
      segmentDescription: document.querySelector("#segment-description"),
      segmentInsight: document.querySelector("#segment-insight"),
      targetSegment: document.querySelector("#target-segment"),
      targetAttractiveness: document.querySelector("#target-attractiveness"),
      targetFit: document.querySelector("#target-fit"),
      targetRationale: document.querySelector("#target-rationale"),
      positionSegment: document.querySelector("#position-segment"),
      positionStatement: document.querySelector("#position-statement"),
      positionProof: document.querySelector("#position-proof"),
      demoPicker: document.querySelector("#demo-picker")
    };

    const sections = {
      segment: document.querySelector("#segment-fields"),
      target: document.querySelector("#target-fields"),
      position: document.querySelector("#position-fields")
    };

    const display = {
      saveButton: document.querySelector("#save-button"),
      focusScore: document.querySelector("#focus-score"),
      focusLabel: document.querySelector("#focus-score-label"),
      segmentsList: document.querySelector("#segments-list"),
      targetsList: document.querySelector("#targets-list"),
      positioningList: document.querySelector("#positioning-list"),
      detailTitle: document.querySelector("#detail-title"),
      detailDescription: document.querySelector("#detail-description"),
      detailInsight: document.querySelector("#detail-insight"),
      detailScore: document.querySelector("#detail-score"),
      detailRationale: document.querySelector("#detail-rationale"),
      detailPosition: document.querySelector("#detail-position"),
      focusInsight: document.querySelector("#focus-insight"),
      messageInsight: document.querySelector("#message-insight"),
      evidenceInsight: document.querySelector("#evidence-insight"),
      reviewList: document.querySelector("#review-list")
    };

    let segments = [];
    let activeSegmentId = null;

    const createId = () => `segment-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const shortText = (text, length = 92) => {
      const clean = String(text || "").replace(/\s+/g, " ").trim();
      return clean.length > length ? `${clean.slice(0, length - 1)}…` : clean;
    };

    const scoreLabel = (score) => {
      if (score >= 4.5) return "Very strong priority";
      if (score >= 3.5) return "Strong priority";
      if (score >= 2.5) return "Moderate priority";
      if (score >= 1.5) return "Low priority";
      return "Very low priority";
    };

    const getSegment = (id) => segments.find((segment) => segment.id === id);

    const refreshSegmentSelectors = () => {
      const currentTarget = fields.targetSegment.value;
      const currentPosition = fields.positionSegment.value;

      const options = segments
        .map(
          (segment) =>
            `<option value="${segment.id}">${segment.name}</option>`
        )
        .join("");

      fields.targetSegment.innerHTML = options || `<option value="">Add a segment first</option>`;
      fields.positionSegment.innerHTML = options || `<option value="">Add a segment first</option>`;

      if (segments.some((segment) => segment.id === currentTarget)) {
        fields.targetSegment.value = currentTarget;
      }

      if (segments.some((segment) => segment.id === currentPosition)) {
        fields.positionSegment.value = currentPosition;
      }

      if (!fields.targetSegment.value && segments[0]) {
        fields.targetSegment.value = segments[0].id;
      }

      if (!fields.positionSegment.value && segments[0]) {
        fields.positionSegment.value = segments[0].id;
      }
    };

    const updateStageUI = () => {
      const stage = fields.stage.value;

      Object.entries(sections).forEach(([key, element]) => {
        element.hidden = key !== stage;
      });

      const labels = {
        segment: "Save segment",
        target: "Save target assessment",
        position: "Save positioning"
      };

      display.saveButton.textContent = labels[stage];

      if (stage === "target" || stage === "position") {
        refreshSegmentSelectors();
      }
    };

    const selectSegment = (segment) => {
      if (!segment) return;

      activeSegmentId = segment.id;

      const priority =
        segment.attractiveness && segment.fit
          ? ((segment.attractiveness + segment.fit) / 2).toFixed(1)
          : null;

      display.detailTitle.textContent = segment.name;
      display.detailDescription.textContent =
        segment.description || "No segment description has been added.";
      display.detailInsight.textContent =
        segment.insight || "No audience insight has been added.";
      display.detailScore.textContent = priority
        ? `${scoreLabel(Number(priority))} — ${priority} / 5`
        : "Not yet assessed.";
      display.detailRationale.textContent =
        segment.targetRationale || "No targeting rationale has been added.";
      display.detailPosition.textContent =
        segment.positionStatement || "No positioning statement has been added.";

      renderCanvas();
    };

    const renderCanvas = () => {
      const targetedSegments = segments.filter(
        (segment) => segment.attractiveness && segment.fit
      );

      display.focusScore.textContent = targetedSegments.length;
      display.focusLabel.textContent =
        targetedSegments.length === 1
          ? "Target segment selected"
          : "Target segments selected";

      display.segmentsList.innerHTML = "";

      if (!segments.length) {
        display.segmentsList.innerHTML =
          `<p class="empty-state">Add a segment based on a real shared need, context or behaviour—not a broad label alone.</p>`;
      } else {
        segments.forEach((segment) => {
          const card = document.createElement("button");
          const isActive = segment.id === activeSegmentId;
          const isDimmed = activeSegmentId && !isActive;

          card.type = "button";
          card.className = `segment-card${isActive ? " active" : ""}${isDimmed ? " dimmed" : ""}`;
          card.setAttribute("aria-pressed", String(isActive));

          card.innerHTML = `
            <span class="card-kicker">Audience segment</span>
            <strong>${shortText(segment.name, 52)}</strong>
            <small>${shortText(segment.description, 92)}</small>
          `;

          card.addEventListener("click", () => selectSegment(segment));
          display.segmentsList.appendChild(card);
        });
      }

      display.targetsList.innerHTML = "";

      if (!targetedSegments.length) {
        display.targetsList.innerHTML =
          `<p class="empty-state">Assess a segment for attractiveness and ability to serve before selecting it as a target.</p>`;
      } else {
        [...targetedSegments]
          .sort(
            (a, b) =>
              (b.attractiveness + b.fit) / 2 -
              (a.attractiveness + a.fit) / 2
          )
          .forEach((segment) => {
            const score = ((segment.attractiveness + segment.fit) / 2).toFixed(1);
            const isActive = segment.id === activeSegmentId;
            const isDimmed = activeSegmentId && !isActive;

            const card = document.createElement("button");
            card.type = "button";
            card.className = `target-card${isActive ? " active" : ""}${isDimmed ? " dimmed" : ""}`;
            card.setAttribute("aria-pressed", String(isActive));

            card.innerHTML = `
              <span class="card-kicker">Priority segment</span>
              <strong>${shortText(segment.name, 48)}</strong>
              <small>${shortText(segment.targetRationale || "No targeting rationale added.", 88)}</small>
              <span class="target-score">${scoreLabel(Number(score))} · ${score}/5</span>
            `;

            card.addEventListener("click", () => selectSegment(segment));
            display.targetsList.appendChild(card);
          });
      }

      display.positioningList.innerHTML = "";

      const positioned = targetedSegments.filter(
        (segment) => segment.positionStatement
      );

      if (!positioned.length) {
        display.positioningList.innerHTML =
          `<p class="empty-state">Write a positioning statement for a selected target segment to create a more focused message.</p>`;
      } else {
        positioned.forEach((segment) => {
          const isDimmed = activeSegmentId && segment.id !== activeSegmentId;

          const card = document.createElement("article");
          card.className = `position-card${isDimmed ? " dimmed" : ""}`;

          card.innerHTML = `
            <span class="card-kicker">Position for ${shortText(segment.name, 34)}</span>
            <strong>Distinct value proposition</strong>
            <p class="position-statement">“${shortText(segment.positionStatement, 330)}”</p>
            <div class="position-divider"></div>
            <div class="position-detail">
              <div>
                <span>Reason to believe</span>
                <p>${shortText(segment.positionProof || "No proof point added.", 170)}</p>
              </div>
            </div>
          `;

          card.addEventListener("click", () => selectSegment(segment));
          display.positioningList.appendChild(card);
        });
      }

      updateInsights();
    };

    const updateInsights = () => {
      const targeted = segments.filter(
        (segment) => segment.attractiveness && segment.fit
      );

      const positioned = targeted.filter(
        (segment) => segment.positionStatement
      );

      display.focusInsight.innerHTML = segments.length
        ? `<strong>${segments.length} segment${segments.length === 1 ? "" : "s"} mapped.</strong> ${targeted.length ? `${targeted.length} have been assessed for strategic priority.` : "Now assess which segments are attractive and genuinely a fit for your capability."}`
        : "Add segments, then choose which groups deserve focused attention.";

      display.messageInsight.innerHTML = positioned.length
        ? `<strong>${positioned.length} positioning statement${positioned.length === 1 ? "" : "s"} drafted.</strong> Ensure each highlights a relevant benefit and a credible reason to believe.`
        : "Add a positioning statement for each priority segment rather than using one generic message.";

      display.evidenceInsight.innerHTML =
        "Validate segment size, needs, accessibility and response using ethically collected customer research, service data, interviews, observation and campaign learning.";

      const prompts = [
        "Does each segment represent a meaningful shared need, context or behaviour—not merely a convenient demographic label?",
        "Is there evidence that the segment is substantial enough, reachable through appropriate channels and likely to value the offer?",
        "Can you serve the chosen target well given your capability, credibility, delivery model, budget and access to channels?",
        "Does the positioning explain why this audience should choose the offer over realistic alternatives, including doing nothing?",
        "Does every claim have a reason to believe, such as a proof point, case study, credible capability or independently verifiable evidence?",
        "Could any segmentation or targeting choice unfairly exclude, stereotype or disadvantage people? If so, redesign it."
      ];

      display.reviewList.innerHTML = "";

      prompts.forEach((prompt) => {
        const item = document.createElement("li");
        item.innerHTML =
          `<span class="review-icon" aria-hidden="true">?</span><span>${prompt}</span>`;
        display.reviewList.appendChild(item);
      });
    };

    const saveSegment = () => {
      const name = fields.segmentName.value.trim();

      if (!name) {
        fields.segmentName.focus();
        return;
      }

      const segment = {
        id: createId(),
        name,
        description: fields.segmentDescription.value.trim(),
        insight: fields.segmentInsight.value.trim(),
        attractiveness: null,
        fit: null,
        targetRationale: "",
        positionStatement: "",
        positionProof: ""
      };

      segments.push(segment);
      refreshSegmentSelectors();
      selectSegment(segment);

      fields.segmentName.value = "";
      fields.segmentDescription.value = "";
      fields.segmentInsight.value = "";
      fields.segmentName.focus();
    };

    const saveTarget = () => {
      const segment = getSegment(fields.targetSegment.value);

      if (!segment) {
        fields.stage.value = "segment";
        updateStageUI();
        fields.segmentName.focus();
        return;
      }

      segment.attractiveness = Number(fields.targetAttractiveness.value);
      segment.fit = Number(fields.targetFit.value);
      segment.targetRationale = fields.targetRationale.value.trim();

      selectSegment(segment);
    };

    const savePositioning = () => {
      const segment = getSegment(fields.positionSegment.value);

      if (!segment) {
        fields.stage.value = "segment";
        updateStageUI();
        fields.segmentName.focus();
        return;
      }

      segment.positionStatement = fields.positionStatement.value.trim();
      segment.positionProof = fields.positionProof.value.trim();

      selectSegment(segment);
    };

    const saveCurrentStage = () => {
      const stage = fields.stage.value;

      if (stage === "segment") saveSegment();
      if (stage === "target") saveTarget();
      if (stage === "position") savePositioning();
    };

    const clearCurrentEntry = () => {
      const stage = fields.stage.value;

      if (stage === "segment") {
        fields.segmentName.value = "";
        fields.segmentDescription.value = "";
        fields.segmentInsight.value = "";
        fields.segmentName.focus();
      }

      if (stage === "target") {
        fields.targetAttractiveness.value = "4";
        fields.targetFit.value = "4";
        fields.targetRationale.value = "";
        fields.targetRationale.focus();
      }

      if (stage === "position") {
        fields.positionStatement.value = "";
        fields.positionProof.value = "";
        fields.positionStatement.focus();
      }
    };

    const loadDemo = (demo) => {
      const demos = {
        "eo-services": {
          offer: "Earth-observation storytelling and engagement services",
          segments: [
            {
              name: "Public-sector climate and place teams",
              description:
                "Teams working on climate adaptation, public engagement or local place decisions who need to make complex environmental evidence accessible and useful.",
              insight:
                "They need credible, practical evidence and engaging materials that can support collaboration across technical, policy and community contexts.",
              attractiveness: 4,
              fit: 5,
              targetRationale:
                "The segment has a clear need for evidence translation and stakeholder engagement, while the offer combines subject literacy, communication design and participatory tools.",
              positionStatement:
                "For public-sector climate and place teams, this service is an evidence-to-engagement partner that turns complex Earth-observation insight into credible, accessible and decision-ready communication because it combines domain literacy, interactive design and locally grounded facilitation.",
              positionProof:
                "Relevant Earth-observation and research-communication experience, practical interactive tools, transparent methods and collaborative delivery with domain partners."
            },
            {
              name: "University research and impact teams",
              description:
                "Research groups and professional-services colleagues working to translate environmental research into engagement, partnerships and usable impact pathways.",
              insight:
                "They need ways to make evidence understandable and to plan credible routes from research activity to wider benefit.",
              attractiveness: 4,
              fit: 4,
              targetRationale:
                "The group values impact-planning capability and has recurring needs around research translation, partnership development and funding bids.",
              positionStatement:
                "For university research and impact teams, this service is a practical strategy-and-design partner for turning environmental research into understandable, participatory and evidentially responsible impact activity.",
              positionProof:
                "Experience with research impact frameworks, collaborative mapping tools and accessible evidence communication."
            },
            {
              name: "Mission-led climate organisations",
              description:
                "Charities, networks and community-focused organisations communicating climate priorities to supporters, partners and decision-makers.",
              insight:
                "They need clear storytelling and evidence without losing the lived experience, justice and local context central to their work.",
              attractiveness: null,
              fit: null,
              targetRationale: "",
              positionStatement: "",
              positionProof: ""
            }
          ]
        },

        "eco-products": {
          offer: "Affordable low-waste home and personal-care products",
          segments: [
            {
              name: "Sustainability-motivated young professionals",
              description:
                "Urban professionals seeking lower-waste choices that fit busy routines, limited space and an everyday budget.",
              insight:
                "They want sustainable choices without inconvenience, excessive research or a perceived compromise in quality.",
              attractiveness: 5,
              fit: 4,
              targetRationale:
                "The segment actively seeks sustainable alternatives, can be reached through digital channels and values convenience alongside credible environmental benefits.",
              positionStatement:
                "For sustainability-motivated young professionals, the range is an easy everyday switch to lower-waste essentials that deliver reliable quality and clear environmental value without adding friction to busy lives.",
              positionProof:
                "Transparent material information, refill options, independent product reviews, practical design and verified supplier standards."
            },
            {
              name: "Value-conscious families",
              description:
                "Households balancing cost, practicality, product performance and a desire to reduce unnecessary waste.",
              insight:
                "They need clear proof that sustainable options are reliable, affordable over time and suitable for family routines.",
              attractiveness: 4,
              fit: 3,
              targetRationale:
                "The group represents repeat-purchase potential but needs stronger price-value communication and distribution in convenient retail channels.",
              positionStatement:
                "For value-conscious families, the range offers dependable household essentials that reduce avoidable waste while making long-term value clear.",
              positionProof:
                "Cost-per-use comparisons, durable packaging, trusted retail availability and family-relevant reviews."
            },
            {
              name: "Low-engagement convenience shoppers",
              description:
                "Consumers who prioritise speed, familiarity and low effort over environmental considerations when making routine purchases.",
              insight:
                "Sustainability claims alone are unlikely to change behaviour unless the alternative is equally convenient and competitively priced.",
              attractiveness: null,
              fit: null,
              targetRationale: "",
              positionStatement: "",
              positionProof: ""
            }
          ]
        },

        "research-software": {
          offer: "Collaborative research-impact mapping software",
          segments: [
            {
              name: "Research-development and impact professionals",
              description:
                "University staff supporting grant applications, impact planning, partnerships and researcher development across multiple projects.",
              insight:
                "They need scalable, credible tools that help researchers move from vague impact aspirations to structured plans.",
              attractiveness: 5,
              fit: 5,
              targetRationale:
                "The segment has recurring planning needs, can adopt tools across teams and benefits from shared templates, governance and exportable outputs.",
              positionStatement:
                "For research-development and impact professionals, the platform is a collaborative impact-planning workspace that makes pathways, stakeholders and evidence needs visible across bids and programmes.",
              positionProof:
                "Built-in frameworks, reusable templates, structured exports, collaboration features and a clear understanding of research-impact practice."
            },
            {
              name: "Principal investigators and research teams",
              description:
                "Academic teams preparing funding proposals or beginning new research programmes with impact and engagement responsibilities.",
              insight:
                "They want practical guidance that reduces ambiguity and helps turn research ideas into funder-ready, collaborative plans.",
              attractiveness: 4,
              fit: 4,
              targetRationale:
                "The group has a strong immediate need during proposal development and can influence wider adoption through successful use cases.",
              positionStatement:
                "For research teams, the platform is a guided way to turn research ideas into credible stakeholder, engagement and evidence plans without starting from a blank page.",
              positionProof:
                "Plain-language prompts, interactive canvases, example pathways and easy-to-share outputs."
            },
            {
              name: "Independent consultants",
              description:
                "Consultants supporting impact strategy, engagement design and research translation for multiple client organisations.",
              insight:
                "They need adaptable tools that make workshops more structured while preserving their own expertise and client relationships.",
              attractiveness: 3,
              fit: 4,
              targetRationale:
                "This group may value a professional toolkit but has varied budget levels and may require flexible pricing.",
              positionStatement: "",
              positionProof: ""
            }
          ]
        }
      };

      const selected = demos[demo];
      if (!selected) return;

      fields.offerName.value = selected.offer;

      segments = selected.segments.map((segment) => ({
        ...segment,
        id: createId()
      }));

      activeSegmentId = segments[0]?.id || null;

      refreshSegmentSelectors();
      populateTargetForm(segments[0]);
      populatePositionForm(segments[0]);

      if (segments[0]) selectSegment(segments[0]);
      else renderCanvas();

      fields.demoPicker.value = demo;
    };

    const populateTargetForm = (segment) => {
      if (!segment) return;
      fields.targetSegment.value = segment.id;
      fields.targetAttractiveness.value = segment.attractiveness || 3;
      fields.targetFit.value = segment.fit || 3;
      fields.targetRationale.value = segment.targetRationale || "";
    };

    const populatePositionForm = (segment) => {
      if (!segment) return;
      fields.positionSegment.value = segment.id;
      fields.positionStatement.value = segment.positionStatement || "";
      fields.positionProof.value = segment.positionProof || "";
    };

    const copyStrategy = async () => {
      const offer = fields.offerName.value.trim() || "Offer not specified.";

      const lines = [
        "STP MARKETING STRATEGY",
        "",
        `Offer: ${offer}`,
        "",
        "SEGMENTS"
      ];

      segments.forEach((segment) => {
        const score =
          segment.attractiveness && segment.fit
            ? ((segment.attractiveness + segment.fit) / 2).toFixed(1)
            : "Not assessed";

        lines.push(`- ${segment.name}`);
        lines.push(`  Description: ${segment.description || "Not added."}`);
        lines.push(`  Audience insight: ${segment.insight || "Not added."}`);
        lines.push(`  Priority score: ${score}`);
        lines.push(`  Target rationale: ${segment.targetRationale || "Not added."}`);
        lines.push(`  Positioning: ${segment.positionStatement || "Not added."}`);
        lines.push(`  Reason to believe: ${segment.positionProof || "Not added."}`);
        lines.push("");
      });

      lines.push(
        "Planning note: Treat segments and positioning as testable hypotheses. Validate them with ethically gathered customer research, behaviour data and campaign learning."
      );

      const button = document.querySelector("#copy-strategy");
      const originalLabel = button.textContent;

      try {
        await navigator.clipboard.writeText(lines.join("\n"));
        button.textContent = "Strategy copied";
      } catch {
        button.textContent = "Copy unavailable";
      }

      window.setTimeout(() => {
        button.textContent = originalLabel;
      }, 1800);
    };

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      saveCurrentStage();
    });

    fields.stage.addEventListener("change", updateStageUI);

    fields.offerName.addEventListener("input", renderCanvas);

    fields.targetSegment.addEventListener("change", () => {
      populateTargetForm(getSegment(fields.targetSegment.value));
    });

    fields.positionSegment.addEventListener("change", () => {
      populatePositionForm(getSegment(fields.positionSegment.value));
    });

    fields.demoPicker.addEventListener("change", (event) => {
      if (event.target.value) loadDemo(event.target.value);
    });

    document.querySelector("#clear-entry").addEventListener("click", clearCurrentEntry);
    document.querySelector("#copy-strategy").addEventListener("click", copyStrategy);

    loadDemo("eo-services");
    updateStageUI();

const form = document.querySelector("#ansoff-form");

    const fields = {
      business: document.querySelector("#business-name"),
      strategy: document.querySelector("#strategy-selector"),
      initiative: document.querySelector("#initiative"),
      audience: document.querySelector("#audience"),
      evidence: document.querySelector("#evidence"),
      risk: document.querySelector("#risk"),
      demoPicker: document.querySelector("#demo-picker")
    };

    const display = {
      coverageScore: document.querySelector("#coverage-score"),
      detailTitle: document.querySelector("#detail-title"),
      detailInitiative: document.querySelector("#detail-initiative"),
      detailAudience: document.querySelector("#detail-audience"),
      detailEvidence: document.querySelector("#detail-evidence"),
      detailRisk: document.querySelector("#detail-risk"),
      detailPrompt: document.querySelector("#detail-prompt"),
      coverageInsight: document.querySelector("#coverage-insight"),
      learningInsight: document.querySelector("#learning-insight"),
      riskInsight: document.querySelector("#risk-insight"),
      guidanceList: document.querySelector("#guidance-list")
    };

    const strategyConfig = {
      penetration: {
        label: "Market Penetration",
        prompt:
          "How can you grow use, retention, frequency, conversion or share among current customers and markets without relying on coercive, deceptive or wasteful tactics?",
        risk:
          "Usually the most familiar option, but saturation, rising acquisition cost, customer fatigue and discount dependence can still undermine value."
      },
      development: {
        label: "Market Development",
        prompt:
          "Which new segment, geography, channel, use case or partner market has a real unmet need for the existing offer—and what adaptation is necessary?",
        risk:
          "The product may be proven, but the market context, customer needs, regulation, language, channel economics and trust signals may be unfamiliar."
      },
      product: {
        label: "Product Development",
        prompt:
          "What new product, feature, service or packaging solves an important unmet need for existing customers better than the alternatives?",
        risk:
          "Customer familiarity does not guarantee demand. Test desirability, feasibility, viability, cannibalisation and the cost to support the new offer."
      },
      diversification: {
        label: "Diversification",
        prompt:
          "Why is a new product for a new market strategically coherent, and what staged evidence would justify progressing beyond a small experiment?",
        risk:
          "This combines unfamiliar product and market assumptions. It can create options, but usually requires the strongest governance, capability and financial discipline."
      }
    };

    let plan = {
      penetration: {
        initiative:
          "Improve activation and repeat use among existing research-development teams through guided onboarding, templates and role-based collaboration prompts.",
        audience:
          "Existing institutional customers and active project teams that already use the platform but have uneven adoption across roles.",
        evidence:
          "Analyse product-usage cohorts and interview active and inactive users; test a guided onboarding sequence with a small group and compare activation, repeat use and reported usefulness.",
        risk:
          "Do not optimise usage through intrusive notifications or dark patterns; ensure the onboarding support saves time and respects user roles, consent and data governance."
      },
      development: {
        initiative:
          "Adapt the existing workspace and learning materials for public-sector innovation teams that need to plan, evidence and communicate local programme outcomes.",
        audience:
          "New public-sector and place-based teams, initially through a small number of partner organisations with a clear shared planning challenge.",
        evidence:
          "Conduct discovery interviews and observe current planning processes; prototype a sector-specific workflow with two partners before committing to broad marketing or product changes.",
        risk:
          "Public-sector procurement, accessibility, data governance and programme context may differ substantially from the existing research-market assumptions."
      },
      product: {
        initiative:
          "Develop an optional evidence-library and impact-storytelling module that helps current customers link plans, indicators, evidence and accessible communication outputs.",
        audience:
          "Current customers who have completed core planning work and need a clearer way to manage evidence and communicate progress to stakeholders.",
        evidence:
          "Test concept desirability with current users, run a lightweight prototype trial and assess whether it improves a genuine workflow rather than adding dashboard complexity.",
        risk:
          "Avoid feature expansion that creates unnecessary data collection, overwhelms users or substitutes polished reporting for meaningful evidence and learning."
      },
      diversification: {
        initiative:
          "Explore a new learning-and-advisory offer for mission-led small businesses seeking simple, evidence-informed ways to plan and report social or environmental outcomes.",
        audience:
          "A new customer group with different budgets, decision processes, support needs and impact-literacy levels from institutional research teams.",
        evidence:
          "Begin with problem interviews and paid discovery workshops; define a narrow hypothesis, a time-limited experiment, clear stop criteria and independent feedback.",
        risk:
          "The offer and market are both new. Do not assume institutional methods transfer directly; assess capability, competing needs, financial exposure and potential mission drift."
      }
    };

    let activeStrategy = "penetration";

    const shortText = (text, length = 95) => {
      const clean = String(text || "").replace(/\s+/g, " ").trim();
      return clean.length > length ? `${clean.slice(0, length - 1)}…` : clean;
    };

    const hasPlan = (strategy) =>
      Boolean(plan[strategy]?.initiative && plan[strategy].initiative.trim());

    const populateForm = (strategy) => {
      const item = plan[strategy] || {};

      fields.strategy.value = strategy;
      fields.initiative.value = item.initiative || "";
      fields.audience.value = item.audience || "";
      fields.evidence.value = item.evidence || "";
      fields.risk.value = item.risk || "";
    };

    const selectStrategy = (strategy) => {
      activeStrategy = strategy;
      populateForm(strategy);
      renderMatrix();
    };

    const renderMatrix = () => {
      const item = plan[activeStrategy] || {};
      const config = strategyConfig[activeStrategy];

      display.detailTitle.textContent = config.label;
      display.detailInitiative.textContent =
        item.initiative || "No initiative has been added for this strategy.";
      display.detailAudience.textContent =
        item.audience || "No target market or audience has been added.";
      display.detailEvidence.textContent =
        item.evidence || "No evidence or test has been added.";
      display.detailRisk.textContent =
        item.risk || "No key risk or boundary has been added.";
      display.detailPrompt.textContent = config.prompt;

      Object.keys(strategyConfig).forEach((strategy) => {
        const card = document.querySelector(`[data-strategy="${strategy}"]`);
        const summary = document.querySelector(`#${strategy}-summary`);
        const status = document.querySelector(`#${strategy}-status`);
        const isActive = strategy === activeStrategy;
        const planned = hasPlan(strategy);

        card.setAttribute("aria-pressed", String(isActive));
        card.classList.toggle("dimmed", Boolean(activeStrategy && !isActive));
        summary.textContent = planned
          ? shortText(plan[strategy].initiative, 104)
          : "No growth option added.";
        status.textContent = planned ? "Mapped" : "Not planned";
      });

      const mapped = Object.keys(strategyConfig).filter(hasPlan).length;
      const missing = Object.keys(strategyConfig).filter((strategy) => !hasPlan(strategy));

      display.coverageScore.textContent = `${mapped}/4`;

      display.coverageInsight.innerHTML = missing.length
        ? `<strong>${mapped} of 4 growth options mapped.</strong> Consider whether ${missing.map((strategy) => strategyConfig[strategy].label).join(", ")} offers a meaningful opportunity worth researching.`
        : "<strong>All four options are mapped.</strong> The priority is not to pursue all of them: compare evidence, strategic fit, timing, capability and risk.";

      const evidenceCount = Object.values(plan).filter(
        (item) => item.evidence && item.evidence.trim()
      ).length;

      display.learningInsight.innerHTML = evidenceCount === 4
        ? "<strong>Every option has an evidence-and-test plan.</strong> Set success measures, decision thresholds and an explicit learning review before scaling."
        : `<strong>${evidenceCount} of 4 options include a test.</strong> Convert the remaining assumptions into small, ethical experiments before committing major resources.`;

      display.riskInsight.innerHTML =
        `<strong>${config.label} risk prompt:</strong> ${config.risk}`;

      const guidance = [
        "Define “existing” and “new” explicitly. A new country, channel, customer segment, use case, feature or business model may carry very different levels of novelty and risk.",
        "Start with the customer problem, not the quadrant. Growth is valuable only if it creates relevant value for a clearly defined audience and can be delivered responsibly.",
        "Use market penetration beyond promotion: improve retention, onboarding, accessibility, product quality, distribution, pricing clarity and customer success where appropriate.",
        "Test market development with local or segment-specific research. Do not assume a proposition, message, channel or operating model transfers unchanged.",
        "For product development and diversification, use staged investment: discovery, prototype, pilot, evaluation and then measured scaling.",
        "Review second-order effects: cannibalisation, service demand, data protection, supply constraints, emissions, customer harm, staff workload and mission drift."
      ];

      display.guidanceList.innerHTML = "";
      guidance.forEach((tip) => {
        const row = document.createElement("li");
        row.innerHTML =
          `<span class="guidance-icon" aria-hidden="true">✓</span><span>${tip}</span>`;
        display.guidanceList.appendChild(row);
      });
    };

    const saveStrategy = () => {
      const strategy = fields.strategy.value;

      plan[strategy] = {
        initiative: fields.initiative.value.trim(),
        audience: fields.audience.value.trim(),
        evidence: fields.evidence.value.trim(),
        risk: fields.risk.value.trim()
      };

      activeStrategy = strategy;
      renderMatrix();
    };

    const clearOption = () => {
      fields.initiative.value = "";
      fields.audience.value = "";
      fields.evidence.value = "";
      fields.risk.value = "";
      fields.initiative.focus();
    };

    const loadDemo = (demo) => {
      const demos = {
        platform: {
          business: "Collaborative research-impact planning platform",
          plan
        },

        consumer: {
          business: "Refillable lower-waste household products brand",
          plan: {
            penetration: {
              initiative:
                "Increase repeat purchase and refill adoption among existing customers through clearer usage guidance, better stock availability and preference-led replenishment reminders.",
              audience:
                "Existing customers who have purchased once but have not yet established a repeat refill routine.",
              evidence:
                "Analyse purchase intervals and service feedback; trial opt-in, user-controlled replenishment reminders and clearer product-use guidance with one customer cohort.",
              risk:
                "Do not pressure customers with misleading scarcity, automatic subscriptions or guilt-based sustainability messaging; make pauses, cancellations and alternatives easy."
            },
            development: {
              initiative:
                "Introduce the existing refill range to independent hospitality and workplace buyers through a pilot with local venues that want lower-waste cleaning options.",
              audience:
                "New B2B customers: small hospitality, co-working and community venues with recurring cleaning-product needs.",
              evidence:
                "Interview buyers about storage, pricing, procurement and staff use; pilot with a limited group and assess product fit, refill logistics and genuine waste reduction.",
              risk:
                "Commercial buyers have different compliance, volume, service and delivery needs; avoid making environmental claims that cannot be verified in each use context."
            },
            product: {
              initiative:
                "Develop a fragrance-free, allergen-aware refill line for existing customers who want lower-waste options that better fit sensitive-skin and low-fragrance preferences.",
              audience:
                "Current customers who value the brand’s refill model but need a different product formulation or ingredient profile.",
              evidence:
                "Conduct needs research, accessibility reviews and controlled product testing; validate safety, labelling, performance and willingness to pay before a full launch.",
              risk:
                "Do not imply health or allergy outcomes without appropriate evidence; make ingredient information, limitations and safety guidance clear."
            },
            diversification: {
              initiative:
                "Explore a circular home-care repair and refill membership service for renters and landlords, combining new products with a new property-management market.",
              audience:
                "A new customer and partner ecosystem involving renters, landlords and property managers with different decision rights and needs.",
              evidence:
                "Start with discovery research and a small, consent-based pilot in one location; test operational feasibility, actual demand, safeguarding and incentives before scaling.",
              risk:
                "This combines new services, products and market relationships. Assess legal responsibilities, repairs liability, equity of access, operational complexity and financial exposure."
            }
          }
        },

        services: {
          business: "Evidence and communications advisory practice",
          plan: {
            penetration: {
              initiative:
                "Grow value within existing accounts by improving client onboarding, clarifying service pathways and offering optional follow-on learning that addresses recurring needs.",
              audience:
                "Current clients and previous clients with continuing evidence, communications or stakeholder-engagement challenges.",
              evidence:
                "Review client feedback, project outcomes and referral patterns; test a structured post-project review and helpful resource sequence with consented clients.",
              risk:
                "Do not treat account growth as entitlement; recommendations must be genuinely useful, transparent and appropriate to the client’s needs and budget."
            },
            development: {
              initiative:
                "Adapt the existing advisory offer for regional cultural organisations that need to articulate public value and evidence community outcomes.",
              audience:
                "New arts, culture and heritage organisations with distinct funding environments, language, constraints and definitions of value.",
              evidence:
                "Conduct sector interviews and co-design a small pilot with partners; test whether current methods need adaptation before broad promotion.",
              risk:
                "Avoid imposing generic measurement models on cultural practice; work with organisations to retain context, plural values and community voice."
            },
            product: {
              initiative:
                "Create a structured digital training programme and facilitation toolkit for existing advisory clients to build internal capability between consultancy engagements.",
              audience:
                "Existing clients that want more self-service learning and repeatable team practices after a supported project.",
              evidence:
                "Prototype short modules and templates with a small client group; evaluate comprehension, accessibility, application and the support required for responsible use.",
              risk:
                "Do not overpromise self-service capability or replace necessary expert support with generic content where decisions are high stakes or context-specific."
            },
            diversification: {
              initiative:
                "Explore a new consumer-facing learning platform that helps individuals assess claims about social and environmental impact in everyday products.",
              audience:
                "A new general-public market with different motivations, literacy levels, price expectations and channels from organisational advisory clients.",
              evidence:
                "Begin with user research, problem validation and a limited educational prototype; establish a sustainable model and editorial governance before monetisation.",
              risk:
                "The practice would enter both a new product category and a new market. Guard against oversimplification, conflicts of interest, misinformation and unsustainable support demands."
            }
          }
        }
      };

      const selected = demos[demo];
      if (!selected) return;

      fields.business.value = selected.business;
      plan = JSON.parse(JSON.stringify(selected.plan));
      fields.demoPicker.value = demo;
      selectStrategy("penetration");
    };

    const copyMatrix = async () => {
      const business = fields.business.value.trim() || "Business / proposition not specified.";

      const lines = [
        "ANSOFF GROWTH STRATEGY MATRIX",
        "",
        `Business / proposition: ${business}`,
        ""
      ];

      Object.entries(strategyConfig).forEach(([strategy, config]) => {
        const item = plan[strategy] || {};

        lines.push(config.label.toUpperCase());
        lines.push(`Initiative: ${item.initiative || "Not added."}`);
        lines.push(`Target market: ${item.audience || "Not added."}`);
        lines.push(`Evidence and test: ${item.evidence || "Not added."}`);
        lines.push(`Key risk / boundary: ${item.risk || "Not added."}`);
        lines.push(`Strategy prompt: ${config.prompt}`);
        lines.push("");
      });

      lines.push(
        "Planning note: The Ansoff matrix is a growth-option framework. Validate customer demand, capability, economics, risk and wider impacts before scaling any initiative."
      );

      const button = document.querySelector("#copy-matrix");
      const originalLabel = button.textContent;

      try {
        await navigator.clipboard.writeText(lines.join("\n"));
        button.textContent = "Matrix copied";
      } catch {
        button.textContent = "Copy unavailable";
      }

      window.setTimeout(() => {
        button.textContent = originalLabel;
      }, 1800);
    };

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      saveStrategy();
    });

    fields.strategy.addEventListener("change", () => {
      selectStrategy(fields.strategy.value);
    });

    fields.demoPicker.addEventListener("change", (event) => {
      if (event.target.value) loadDemo(event.target.value);
    });

    document.querySelector("#clear-option").addEventListener("click", clearOption);
    document.querySelector("#copy-matrix").addEventListener("click", copyMatrix);

    document.querySelectorAll(".strategy-card").forEach((card) => {
      card.addEventListener("click", () => {
        selectStrategy(card.dataset.strategy);
      });
    });

    selectStrategy("penetration");

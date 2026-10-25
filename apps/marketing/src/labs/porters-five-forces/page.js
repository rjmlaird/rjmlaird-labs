const form = document.querySelector("#forces-form");

    const fields = {
      market: document.querySelector("#market-name"),
      force: document.querySelector("#force-selector"),
      score: document.querySelector("#force-score"),
      scoreOutput: document.querySelector("#force-score-value"),
      rationale: document.querySelector("#force-rationale"),
      response: document.querySelector("#force-response"),
      demoPicker: document.querySelector("#demo-picker")
    };

    const detail = {
      title: document.querySelector("#detail-title"),
      rationale: document.querySelector("#detail-rationale"),
      score: document.querySelector("#detail-score"),
      response: document.querySelector("#detail-response"),
      question: document.querySelector("#detail-question"),
      interpretation: document.querySelector("#detail-interpretation")
    };

    const display = {
      market: document.querySelector("#industry-name-display"),
      attractivenessLabel: document.querySelector("#attractiveness-label"),
      attractivenessScore: document.querySelector("#attractiveness-score"),
      strongestForce: document.querySelector("#strongest-force"),
      strategicFocus: document.querySelector("#strategic-focus"),
      watchFor: document.querySelector("#watch-for"),
      strategyList: document.querySelector("#strategy-list")
    };

    const forceConfig = {
      rivalry: {
        label: "Rivalry among existing competitors",
        shortLabel: "Rivalry",
        question:
          "How intensely do existing providers compete on price, quality, differentiation, capacity and access to customers?",
        interpretation:
          "High rivalry can reduce prices or raise the cost of competing, especially where offers are undifferentiated."
      },
      entrants: {
        label: "Threat of new entrants",
        shortLabel: "New entrants",
        question:
          "How easily could credible new competitors enter, gain trust, access distribution and win customers?",
        interpretation:
          "High entry threat can cap returns by adding capacity and increasing pressure on price, marketing or investment."
      },
      buyers: {
        label: "Bargaining power of buyers",
        shortLabel: "Buyer power",
        question:
          "Can customers force lower prices, demand more service or switch between alternatives at low cost?",
        interpretation:
          "High buyer power shifts value toward customers and can make contracts more demanding or less profitable."
      },
      suppliers: {
        label: "Bargaining power of suppliers",
        shortLabel: "Supplier power",
        question:
          "How dependent are providers on concentrated, differentiated or difficult-to-replace suppliers, platforms, data or talent?",
        interpretation:
          "High supplier power can raise costs, reduce flexibility or constrain quality, speed and terms of delivery."
      },
      substitutes: {
        label: "Threat of substitutes",
        shortLabel: "Substitutes",
        question:
          "What different products, services or ways of solving the underlying customer need could replace this offer?",
        interpretation:
          "High substitute pressure limits pricing power when customers can meet the same need differently."
      }
    };

    let assessments = {
      rivalry: {
        score: 4,
        rationale:
          "Specialist agencies, consultancies, universities and internal teams compete for finite public-sector budgets. Differentiation depends on credible domain knowledge, trusted relationships, accessible storytelling and demonstrable outcomes.",
        response:
          "Differentiate through combined Earth-observation literacy, responsible communication, interactive tools and locally grounded stakeholder engagement."
      },
      entrants: {
        score: 3,
        rationale:
          "Generalist consultancies and new digital studios can enter relatively easily, but domain credibility, trusted networks, procurement evidence and subject expertise create meaningful barriers.",
        response:
          "Build visible proof of expertise, publish useful tools, develop partnerships and make methodology and outcomes legible."
      },
      buyers: {
        score: 4,
        rationale:
          "Public-sector and research buyers often have formal procurement, limited budgets and several potential providers. They may also choose to deliver work internally.",
        response:
          "Frame offers around specific decision needs, create modular services and demonstrate the cost of unclear communication or weak engagement."
      },
      suppliers: {
        score: 2,
        rationale:
          "Open Earth-observation data reduces some dependency, but specialist talent, proprietary platforms and access to trusted local partners can still constrain delivery.",
        response:
          "Use open standards where appropriate, develop reusable capabilities and avoid unnecessary reliance on a single platform or contractor."
      },
      substitutes: {
        score: 3,
        rationale:
          "Internal communications teams, generalist agencies, generic dashboard software and off-the-shelf reports can meet parts of the same need at lower apparent cost.",
        response:
          "Show why context, facilitation, research literacy and carefully designed interaction create value beyond a generic deliverable."
      }
    };

    let activeForce = "rivalry";

    const shortText = (text, length = 88) => {
      const clean = String(text || "").replace(/\s+/g, " ").trim();
      return clean.length > length ? `${clean.slice(0, length - 1)}…` : clean;
    };

    const pressureLabel = (score) => {
      if (score >= 4.5) return "Very strong";
      if (score >= 3.5) return "Strong";
      if (score >= 2.5) return "Moderate";
      if (score >= 1.5) return "Low";
      return "Weak";
    };

    const attractivenessLabel = (average) => {
      if (average >= 4.25) return "Challenging";
      if (average >= 3.35) return "Pressured";
      if (average >= 2.35) return "Moderate";
      if (average >= 1.5) return "Favourable";
      return "Attractive";
    };

    const updateScoreDisplay = () => {
      fields.scoreOutput.textContent = fields.score.value;
    };

    const selectForce = (force) => {
      activeForce = force;

      const assessment = assessments[force];
      const config = forceConfig[force];

      detail.title.textContent = config.label;
      detail.rationale.textContent =
        assessment?.rationale || "No rationale has been added for this force.";
      detail.score.textContent = assessment
        ? `${pressureLabel(assessment.score)} pressure — ${assessment.score} / 5`
        : "Not assessed";
      detail.response.textContent =
        assessment?.response || "Add a strategic response for this force.";
      detail.question.textContent = config.question;
      detail.interpretation.textContent = config.interpretation;

      renderAnalysis();
    };

    const renderAnalysis = () => {
      const marketName = fields.market.value.trim() || "Your market";
      display.market.textContent = shortText(marketName, 62);

      Object.keys(forceConfig).forEach((force) => {
        const assessment = assessments[force];
        const summary = document.querySelector(`#${force}-summary`);
        const score = document.querySelector(`#${force}-score`);
        const button = document.querySelector(`[data-force="${force}"]`);

        if (summary) {
          summary.textContent = assessment
            ? shortText(assessment.rationale, 86)
            : "No assessment added.";
        }

        if (score) {
          score.textContent = assessment
            ? `${pressureLabel(assessment.score)} · ${assessment.score} / 5`
            : "Not scored";
        }

        if (button) {
          const isActive = force === activeForce;
          button.setAttribute("aria-pressed", String(isActive));
          button.classList.toggle("dimmed", Boolean(activeForce && !isActive));
        }
      });

      document.querySelector("#industry-core").classList.toggle(
        "dimmed",
        Boolean(activeForce && activeForce !== "rivalry")
      );

      const completed = Object.values(assessments).filter(Boolean);
      const average =
        completed.reduce((total, item) => total + item.score, 0) / completed.length;

      display.attractivenessLabel.textContent = attractivenessLabel(average);
      display.attractivenessScore.textContent = `Industry pressure: ${average.toFixed(1)} / 5`;

      const ranked = Object.entries(assessments)
        .sort(([, a], [, b]) => b.score - a.score)
        .map(([force, assessment]) => ({ force, ...assessment }));

      const strongest = ranked[0];
      const weakest = ranked[ranked.length - 1];

      display.strongestForce.innerHTML =
        `<strong>${forceConfig[strongest.force].shortLabel}</strong> is currently the strongest pressure at ${strongest.score} / 5.`;

      display.strategicFocus.innerHTML =
        `<strong>Focus on ${forceConfig[strongest.force].shortLabel.toLowerCase()}.</strong> ${shortText(strongest.response, 132)}`;

      display.watchFor.innerHTML =
        `<strong>${forceConfig[weakest.force].shortLabel}</strong> is currently the lowest pressure, but it may change with technology, regulation, concentration or customer behaviour.`;

      const prompts = [
        "Define the market narrowly enough that the same buyers, alternatives and competitive conditions apply.",
        "Separate direct competitors from substitutes that solve the same underlying customer problem in another way.",
        "Identify structural drivers—not just individual brands—including switching costs, concentration, entry barriers, differentiation and procurement.",
        "Look beyond current conditions: which forces could become stronger or weaker over the next two to five years?",
        "Convert the diagnosis into choices: where can the organisation differentiate, reduce dependency, raise switching costs or avoid head-to-head rivalry?"
      ];

      display.strategyList.innerHTML = "";
      prompts.forEach((prompt) => {
        const item = document.createElement("li");
        item.innerHTML =
          `<span class="strategy-icon" aria-hidden="true">?</span><span>${prompt}</span>`;
        display.strategyList.appendChild(item);
      });
    };

    const saveAssessment = () => {
      const force = fields.force.value;

      assessments[force] = {
        score: Number(fields.score.value),
        rationale: fields.rationale.value.trim() || "No rationale added.",
        response: fields.response.value.trim() || "No strategic response added."
      };

      selectForce(force);
    };

    const populateForceForm = (force) => {
      const assessment = assessments[force];

      fields.force.value = force;
      fields.score.value = assessment?.score ?? 3;
      fields.rationale.value = assessment?.rationale ?? "";
      fields.response.value = assessment?.response ?? "";
      updateScoreDisplay();
    };

    const clearForceForm = () => {
      fields.score.value = 3;
      fields.rationale.value = "";
      fields.response.value = "";
      updateScoreDisplay();
      fields.rationale.focus();
    };

    const loadDemo = (demo) => {
      const demos = {
        "eo-services": {
          market:
            "Earth-observation and satellite-data communication services for UK public-sector and climate organisations",
          assessments
        },
        "research-impact": {
          market:
            "Research-impact and public-engagement consultancy services for UK universities and research projects",
          assessments: {
            rivalry: {
              score: 4,
              rationale:
                "Universities can use internal research-development teams, established impact consultancies, freelance specialists and academic staff. Buyers may see offers as interchangeable unless expertise and evidence are clear.",
              response:
                "Position around a distinctive combination of impact strategy, visual tools, responsible claims, stakeholder mapping and science communication."
            },
            entrants: {
              score: 3,
              rationale:
                "Entry costs for independent consultants are relatively low, but credibility, track record, trusted institutional relationships and knowledge of funding contexts create barriers.",
              response:
                "Build visible case studies, reusable tools, partner referrals and a clear methodology that demonstrates practical value."
            },
            buyers: {
              score: 4,
              rationale:
                "University budgets can be constrained and procurement processes formal. Buyers may have internal alternatives and expect tailored outcomes, compliance awareness and strong evidence of value.",
              response:
                "Offer modular workshops and tools, clarify deliverables and link work to specific bid, REF, partnership or programme needs."
            },
            suppliers: {
              score: 2,
              rationale:
                "The service depends mainly on specialist expertise, stakeholder access and appropriate digital tools rather than a small number of dominant commercial suppliers.",
              response:
                "Maintain a flexible network of collaborators and accessible, portable toolchains."
            },
            substitutes: {
              score: 4,
              rationale:
                "Templates, AI tools, internal teams, generic training and standard consultancy reports can substitute for parts of the service.",
              response:
                "Demonstrate the difference between generic content and participatory, evidence-aware tools that help teams make better decisions."
            }
          }
        },
        "sustainable-marketing": {
          market:
            "Sustainability and climate communications services for UK mission-led organisations",
          assessments: {
            rivalry: {
              score: 4,
              rationale:
                "Creative agencies, sustainability consultancies, freelance communicators and internal marketing teams compete for similar budgets and may offer overlapping services.",
              response:
                "Differentiate with credible climate literacy, transparent claims practice, measurable communication objectives and specialist visual storytelling."
            },
            entrants: {
              score: 4,
              rationale:
                "Digital tools and low-cost freelance models make entry easier, particularly for content production and design services.",
              response:
                "Build defensible expertise, trusted partnerships, intellectual property and proof that combines strategy with outcomes."
            },
            buyers: {
              score: 3,
              rationale:
                "Mission-led organisations value specialist knowledge, but budget sensitivity and grant cycles can increase price pressure and shorten contracts.",
              response:
                "Create clear packages, demonstrate value over time and position communications as an enabler of trust, participation and fundraising."
            },
            suppliers: {
              score: 3,
              rationale:
                "Reliance on specialist freelancers, creative software, paid media platforms and data providers can affect costs and delivery flexibility.",
              response:
                "Develop reusable systems, fair supplier relationships and platform-independent content assets."
            },
            substitutes: {
              score: 4,
              rationale:
                "Internal staff, AI-generated content, volunteer support, social templates and general-purpose agencies can replace elements of the service.",
              response:
                "Focus on the strategic work that generic production cannot easily substitute: positioning, audience insight, evidence, ethics and coherent campaign design."
            }
          }
        }
      };

      const selectedDemo = demos[demo];
      if (!selectedDemo) return;

      fields.market.value = selectedDemo.market;
      assessments = JSON.parse(JSON.stringify(selectedDemo.assessments));
      fields.demoPicker.value = demo;

      populateForceForm("rivalry");
      selectForce("rivalry");
    };

    const copyAnalysis = async () => {
      const market = fields.market.value.trim() || "Market not specified.";

      const lines = [
        "PORTER'S FIVE FORCES ANALYSIS",
        "",
        `Market: ${market}`,
        ""
      ];

      Object.entries(forceConfig).forEach(([force, config]) => {
        const assessment = assessments[force];

        lines.push(config.label.toUpperCase());
        lines.push(`Pressure: ${pressureLabel(assessment.score)} (${assessment.score} / 5)`);
        lines.push(`Rationale: ${assessment.rationale}`);
        lines.push(`Strategic response: ${assessment.response}`);
        lines.push("");
      });

      lines.push(
        "Planning note: This is a structured hypothesis about market conditions. Validate it with customer, competitor, supplier, pricing and market research."
      );

      const button = document.querySelector("#copy-analysis");
      const originalLabel = button.textContent;

      try {
        await navigator.clipboard.writeText(lines.join("\n"));
        button.textContent = "Analysis copied";
      } catch {
        button.textContent = "Copy unavailable";
      }

      window.setTimeout(() => {
        button.textContent = originalLabel;
      }, 1800);
    };

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      saveAssessment();
    });

    fields.score.addEventListener("input", updateScoreDisplay);

    fields.force.addEventListener("change", () => {
      populateForceForm(fields.force.value);
    });

    fields.market.addEventListener("input", renderAnalysis);

    fields.demoPicker.addEventListener("change", (event) => {
      if (event.target.value) loadDemo(event.target.value);
    });

    document.querySelector("#clear-force").addEventListener("click", clearForceForm);

    document.querySelector("#copy-analysis").addEventListener("click", copyAnalysis);

    document.querySelectorAll(".force-card").forEach((button) => {
      button.addEventListener("click", () => {
        const force = button.dataset.force;
        populateForceForm(force);
        selectForce(force);
      });
    });

    document.querySelector("#industry-core").addEventListener("click", () => {
      populateForceForm("rivalry");
      selectForce("rivalry");
    });

    document.querySelector("#industry-core").setAttribute("tabindex", "0");
    document.querySelector("#industry-core").setAttribute("role", "button");
    document.querySelector("#industry-core").setAttribute(
      "aria-label",
      "Rivalry among existing competitors. Click to inspect."
    );

    document.querySelector("#industry-core").addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        populateForceForm("rivalry");
        selectForce("rivalry");
      }
    });

    updateScoreDisplay();
    populateForceForm("rivalry");
    selectForce("rivalry");

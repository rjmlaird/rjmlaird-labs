const form = document.querySelector("#loyalty-form");

    const fields = {
      brand: document.querySelector("#brand-name"),
      stage: document.querySelector("#stage-selector"),
      outcome: document.querySelector("#outcome"),
      activity: document.querySelector("#activity"),
      measure: document.querySelector("#measure"),
      race: document.querySelector("#race-stage"),
      boundary: document.querySelector("#boundary"),
      demoPicker: document.querySelector("#demo-picker")
    };

    const display = {
      stageCount: document.querySelector("#stage-count"),
      detailTitle: document.querySelector("#detail-title"),
      detailOutcome: document.querySelector("#detail-outcome"),
      detailActivity: document.querySelector("#detail-activity"),
      detailMeasure: document.querySelector("#detail-measure"),
      detailRace: document.querySelector("#detail-race"),
      detailBoundary: document.querySelector("#detail-boundary"),
      coverageInsight: document.querySelector("#coverage-insight"),
      valueInsight: document.querySelector("#value-insight"),
      engagementInsight: document.querySelector("#engagement-insight"),
      guidanceList: document.querySelector("#guidance-list")
    };

    const stageConfig = {
      prospect: {
        label: "Prospect",
        prompt:
          "A person or organisation with a relevant need who is considering options, but has not yet made a purchase or commitment."
      },
      customer: {
        label: "Customer",
        prompt:
          "A first-time buyer or subscriber assessing whether the actual experience delivers the value they expected."
      },
      client: {
        label: "Client",
        prompt:
          "A repeat customer with an established relationship, familiarity and a reason to continue choosing the organisation."
      },
      supporter: {
        label: "Supporter",
        prompt:
          "A loyal, engaged customer who may participate, provide feedback or support the brand, without being expected to promote it publicly."
      },
      advocate: {
        label: "Advocate",
        prompt:
          "A customer who voluntarily recommends, refers, reviews or otherwise speaks positively about the brand based on authentic experience."
      }
    };

    const raceLabels = {
      reach: "Reach — awareness and discoverability",
      act: "Act — useful interactions and intent",
      convert: "Convert — first transaction or commitment",
      engage: "Engage — retention, repeat value and advocacy"
    };

    let ladder = {
      prospect: {
        outcome:
          "Understand whether the platform is relevant to their planning challenge and make an informed decision without unnecessary form-filling or pressure.",
        activity:
          "Offer practical examples, accessible product information and an optional short discovery session focused on the customer’s own planning context.",
        measure:
          "Qualified enquiry quality, helpful-content completion and voluntary follow-up",
        race: "reach",
        boundary:
          "Avoid gating essential decision information, pre-ticked marketing consent and misleading urgency. Make data use clear and give people straightforward choices."
      },
      customer: {
        outcome:
          "Achieve a clear first success quickly and know where to find help, so the initial purchase or subscription becomes genuinely useful.",
        activity:
          "Provide role-sensitive onboarding, a concise getting-started path and responsive human support for early blockers or accessibility needs.",
        measure:
          "Time to first meaningful outcome, task success, support resolution and customer-reported confidence",
        race: "convert",
        boundary:
          "Do not conceal limitations or make cancellation difficult. Ensure onboarding helps the customer decide whether continued use is right for them."
      },
      client: {
        outcome:
          "Continue receiving relevant value through reliable use, improved workflows and support that respects their context, time and preferences.",
        activity:
          "Share optional usage reviews, relevant learning resources and product improvements tied to stated customer needs rather than generic upsell pressure.",
        measure:
          "Renewal, repeat use, retention by cohort, customer effort and outcome quality",
        race: "engage",
        boundary:
          "Separate useful service communications from promotional messages and make preference controls straightforward."
      },
      supporter: {
        outcome:
          "Feel heard and able to shape improvements when they choose to contribute feedback, ideas or community knowledge.",
        activity:
          "Invite customers into accessible feedback sessions, product councils or community learning spaces with clear expectations and visible follow-through.",
        measure:
          "Voluntary participation, feedback usefulness, follow-through rate and participant experience",
        race: "engage",
        boundary:
          "Never extract unpaid labour or imply that support requires public participation. Explain how feedback will be used and acknowledge contributors fairly."
      },
      advocate: {
        outcome:
          "Recommend the product only when it is genuinely appropriate, based on a positive experience and confidence that referrals will be treated well.",
        activity:
          "Make it easy—but never obligatory—to leave an honest review, share a case study or refer a peer; thank advocates without scripting their views.",
        measure:
          "Voluntary referrals, independently expressed reviews, recommendation quality and referred-customer fit",
        race: "engage",
        boundary:
          "Do not incentivise undisclosed endorsements, suppress critical feedback or reward advocates for misleading claims."
      }
    };

    let activeStage = "prospect";

    const shortText = (text, length = 96) => {
      const clean = String(text || "").replace(/\s+/g, " ").trim();
      return clean.length > length ? `${clean.slice(0, length - 1)}…` : clean;
    };

    const stageIsPlanned = (stage) =>
      Boolean(ladder[stage]?.outcome && ladder[stage].outcome.trim());

    const populateForm = (stage) => {
      const item = ladder[stage] || {};

      fields.stage.value = stage;
      fields.outcome.value = item.outcome || "";
      fields.activity.value = item.activity || "";
      fields.measure.value = item.measure || "";
      fields.race.value = item.race || "engage";
      fields.boundary.value = item.boundary || "";
    };

    const selectStage = (stage) => {
      activeStage = stage;
      populateForm(stage);
      renderLadder();
    };

    const renderLadder = () => {
      const item = ladder[activeStage] || {};
      const config = stageConfig[activeStage];

      display.detailTitle.textContent = config.label;
      display.detailOutcome.textContent =
        item.outcome || "No customer outcome has been added for this stage.";
      display.detailActivity.textContent =
        item.activity || "No helpful activity has been added.";
      display.detailMeasure.textContent =
        item.measure || "No meaningful measure has been added.";
      display.detailRace.textContent = raceLabels[item.race] || "Not assigned";
      display.detailBoundary.textContent =
        item.boundary || "No customer-experience boundary has been added.";

      Object.keys(stageConfig).forEach((stage) => {
        const rung = document.querySelector(`[data-stage="${stage}"]`);
        const summary = document.querySelector(`#${stage}-summary`);
        const status = document.querySelector(`#${stage}-status`);
        const isActive = stage === activeStage;
        const planned = stageIsPlanned(stage);

        rung.setAttribute("aria-pressed", String(isActive));
        rung.classList.toggle("dimmed", Boolean(activeStage && !isActive));
        summary.textContent = planned
          ? shortText(ladder[stage].outcome, 104)
          : "No stage plan added.";
        status.textContent = planned ? "Planned" : "Not planned";
      });

      const plannedCount = Object.keys(stageConfig).filter(stageIsPlanned).length;
      const missing = Object.keys(stageConfig).filter((stage) => !stageIsPlanned(stage));

      display.stageCount.textContent = `${plannedCount}/5`;

      display.coverageInsight.innerHTML = missing.length
        ? `<strong>${plannedCount} of 5 stages mapped.</strong> Consider whether ${missing.map((stage) => stageConfig[stage].label).join(", ")} needs an intentional customer experience and measure.`
        : "<strong>All five stages are mapped.</strong> Focus on the moments with the greatest customer friction or opportunity rather than adding activity everywhere.";

      const engageStages = ["client", "supporter", "advocate"];
      const engageCount = engageStages.filter(stageIsPlanned).length;

      display.valueInsight.innerHTML =
        `<strong>${engageCount} of 3 relationship stages are planned.</strong> Strengthen loyalty by improving product and service value, reliability, support, transparency and customer control—not just communication frequency.`;

      display.engagementInsight.innerHTML =
        `<strong>${config.label} prompt:</strong> ${config.prompt}`;

      const guidance = [
        "Define stages by observable customer behaviour and relationship needs, not only by database labels or campaign status.",
        "Measure success with customer-centred indicators such as task success, customer effort, renewal, retention, repeat value, complaint resolution and voluntary recommendation.",
        "Connect messaging to meaningful value. For example, a reminder is useful only when it helps someone achieve an outcome they genuinely want.",
        "Expect movement in both directions. Analyse lapse and churn with care, then address service failures, changing needs, affordability, relevance or timing rather than defaulting to more pressure.",
        "Use RACE to connect loyalty activity with the full lifecycle: Reach creates awareness, Act enables interaction, Convert supports a fair first commitment and Engage develops the relationship.",
        "Respect consent and privacy. Keep marketing preferences accessible, avoid manipulative urgency and ensure reviews, referrals and testimonials are voluntary and transparently disclosed."
      ];

      display.guidanceList.innerHTML = "";
      guidance.forEach((tip) => {
        const item = document.createElement("li");
        item.innerHTML =
          `<span class="guidance-icon" aria-hidden="true">✓</span><span>${tip}</span>`;
        display.guidanceList.appendChild(item);
      });
    };

    const saveStage = () => {
      const stage = fields.stage.value;

      ladder[stage] = {
        outcome: fields.outcome.value.trim(),
        activity: fields.activity.value.trim(),
        measure: fields.measure.value.trim(),
        race: fields.race.value,
        boundary: fields.boundary.value.trim()
      };

      activeStage = stage;
      renderLadder();
    };

    const clearStage = () => {
      fields.outcome.value = "";
      fields.activity.value = "";
      fields.measure.value = "";
      fields.race.value = "engage";
      fields.boundary.value = "";
      fields.outcome.focus();
    };

    const loadDemo = (demo) => {
      const demos = {
        platform: {
          brand: "Collaborative research-impact planning platform",
          ladder
        },

        ecommerce: {
          brand: "Refillable lower-waste household products brand",
          ladder: {
            prospect: {
              outcome:
                "Understand product performance, ingredients, price, refill process and delivery options well enough to decide whether the offer fits their home and values.",
              activity:
                "Provide accessible product comparisons, transparent ingredient and packaging information, practical usage demonstrations and honest answers to common refill questions.",
              measure:
                "Helpful-content use, informed product-page progression, voluntary email sign-up and customer-reported clarity",
              race: "reach",
              boundary:
                "Avoid greenwashing, hidden delivery costs, artificial scarcity and forcing an email address before people can access essential product information."
            },
            customer: {
              outcome:
                "Receive the first order accurately, understand how to use or refill products safely and experience the promised quality without avoidable friction.",
              activity:
                "Offer clear fulfilment updates, accessible first-use guidance, easy support and a straightforward route for returns, issues or delivery problems.",
              measure:
                "On-time delivery, first-order satisfaction, issue-resolution time and repeat-purchase intent",
              race: "convert",
              boundary:
                "Do not make returns, refunds or subscription changes difficult. Ensure claims about waste reduction and product performance are clear and supportable."
            },
            client: {
              outcome:
                "Maintain an affordable, convenient refill routine that continues to work for their household and changing needs.",
              activity:
                "Enable optional replenishment reminders, flexible subscription controls, bundle adjustments and practical support based on purchase patterns only where consented.",
              measure:
                "Repeat purchase, subscription retention, customer effort, cancellation reasons and satisfaction",
              race: "engage",
              boundary:
                "No surprise renewals, hidden cancellation routes or default over-ordering. Let customers control timing, frequency, data use and communication preferences."
            },
            supporter: {
              outcome:
                "Contribute ideas or feedback about products, refill logistics or lower-waste living if and when they find participation valuable.",
              activity:
                "Invite customers to optional product-feedback sessions, transparent packaging trials or community tips exchanges, and show what changed as a result.",
              measure:
                "Voluntary participation, feedback quality, implementation follow-through and participant satisfaction",
              race: "engage",
              boundary:
                "Do not rely on unpaid community work for essential product development or shame customers who cannot adopt every lower-waste practice."
            },
            advocate: {
              outcome:
                "Share an honest recommendation when the product genuinely helps them, with confidence that friends will receive the same transparent experience.",
              activity:
                "Offer optional review and referral pathways, clearly disclose any rewards and welcome balanced feedback as well as praise.",
              measure:
                "Voluntary reviews, referral conversion quality, referred-customer satisfaction and authenticity of recommendations",
              race: "engage",
              boundary:
                "Never require positive reviews, hide critical feedback or reward customers for environmental claims they cannot substantiate."
            }
          }
        },

        services: {
          brand: "Evidence and communications advisory practice",
          ladder: {
            prospect: {
              outcome:
                "Understand the practice’s approach, expertise, scope, fees and fit before investing time in a conversation or procurement process.",
              activity:
                "Provide clear service descriptions, accessible case examples, transparent boundaries and an optional introductory discussion focused on the prospective client’s needs.",
              measure:
                "Qualified enquiry quality, discovery-call usefulness and fit between proposed work and client need",
              race: "reach",
              boundary:
                "Avoid overstating results, pressuring organisations with limited budgets or collecting unnecessary sensitive information during early discovery."
            },
            customer: {
              outcome:
                "Experience a clear, respectful project start with shared expectations, accessible communication and an early sign that the work addresses their real context.",
              activity:
                "Use a collaborative kickoff, clarify roles and decisions, agree communication preferences and provide early useful outputs or learning.",
              measure:
                "Onboarding satisfaction, project clarity, time to first useful output and issue resolution",
              race: "convert",
              boundary:
                "Do not conceal scope changes, dependencies or risks. Make the client’s right to challenge, pause or change direction clear."
            },
            client: {
              outcome:
                "Continue to receive context-sensitive support that builds internal capability rather than creating unnecessary dependency on external advice.",
              activity:
                "Offer reflective reviews, optional learning resources and future support pathways aligned with the client’s priorities and capacity.",
              measure:
                "Repeat engagement, client capability growth, project outcomes and customer effort",
              race: "engage",
              boundary:
                "Recommend further work only where it is genuinely helpful; do not manufacture complexity or withhold knowledge needed for client autonomy."
            },
            supporter: {
              outcome:
                "Choose to contribute peer learning, feedback or collaborative insight because participation feels useful, safe and recognised.",
              activity:
                "Host opt-in learning exchanges and invite feedback on methods, accessibility and relevance; share back learning in a useful form.",
              measure:
                "Voluntary participation, participant experience, peer-learning value and follow-through",
              race: "engage",
              boundary:
                "Do not extract case studies, testimonials or strategic information without informed permission, fair recognition and agreed boundaries."
            },
            advocate: {
              outcome:
                "Recommend the practice to peers when they believe it is genuinely suited to another organisation’s needs.",
              activity:
                "Make referrals and honest testimonials optional, easy and transparent; thank contributors while preserving their independence and voice.",
              measure:
                "Voluntary referrals, recommendation relevance, referred-client fit and long-term reputation",
              race: "engage",
              boundary:
                "Do not incentivise undisclosed endorsements, script testimonials or pressure clients to endorse work that did not meet their needs."
            }
          }
        }
      };

      const selected = demos[demo];
      if (!selected) return;

      fields.brand.value = selected.brand;
      ladder = JSON.parse(JSON.stringify(selected.ladder));
      fields.demoPicker.value = demo;
      selectStage("prospect");
    };

    const copyLadder = async () => {
      const brand = fields.brand.value.trim() || "Brand / service not specified.";
      const lines = [
        "CUSTOMER LOYALTY LADDER",
        "",
        `Brand / service: ${brand}`,
        ""
      ];

      Object.entries(stageConfig).forEach(([stage, config]) => {
        const item = ladder[stage] || {};

        lines.push(config.label.toUpperCase());
        lines.push(`Customer outcome: ${item.outcome || "Not added."}`);
        lines.push(`Helpful activity: ${item.activity || "Not added."}`);
        lines.push(`Meaningful measure: ${item.measure || "Not added."}`);
        lines.push(`RACE link: ${raceLabels[item.race] || "Not assigned"}`);
        lines.push(`Experience boundary: ${item.boundary || "Not added."}`);
        lines.push("");
      });

      lines.push(
        "Planning note: Loyalty grows through sustained customer value, trust and fair experience design. Customers may move forward, pause, lapse or re-engage at any time."
      );

      const button = document.querySelector("#copy-ladder");
      const originalLabel = button.textContent;

      try {
        await navigator.clipboard.writeText(lines.join("\n"));
        button.textContent = "Ladder copied";
      } catch {
        button.textContent = "Copy unavailable";
      }

      window.setTimeout(() => {
        button.textContent = originalLabel;
      }, 1800);
    };

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      saveStage();
    });

    fields.stage.addEventListener("change", () => {
      selectStage(fields.stage.value);
    });

    fields.demoPicker.addEventListener("change", (event) => {
      if (event.target.value) loadDemo(event.target.value);
    });

    document.querySelector("#clear-stage").addEventListener("click", clearStage);
    document.querySelector("#copy-ladder").addEventListener("click", copyLadder);

    document.querySelectorAll(".rung").forEach((rung) => {
      rung.addEventListener("click", () => {
        selectStage(rung.dataset.stage);
      });
    });

    selectStage("prospect");

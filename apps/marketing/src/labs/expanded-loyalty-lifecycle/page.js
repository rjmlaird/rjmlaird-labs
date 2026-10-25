const form = document.querySelector("#lifecycle-form");

    const fields = {
      brand: document.querySelector("#brand-name"),
      mode: document.querySelector("#business-mode"),
      loyaltyStage: document.querySelector("#loyalty-stage"),
      raceStage: document.querySelector("#race-stage"),
      channel: document.querySelector("#channel-type"),
      outcome: document.querySelector("#customer-outcome"),
      activity: document.querySelector("#activity"),
      measure: document.querySelector("#measure"),
      priority: document.querySelector("#priority"),
      boundary: document.querySelector("#boundary"),
      demo: document.querySelector("#demo-picker")
    };

    const display = {
      coverageScore: document.querySelector("#coverage-score"),
      detailTitle: document.querySelector("#detail-title"),
      detailOutcome: document.querySelector("#detail-outcome"),
      detailActivity: document.querySelector("#detail-activity"),
      detailChannel: document.querySelector("#detail-channel"),
      detailMeasure: document.querySelector("#detail-measure"),
      detailBoundary: document.querySelector("#detail-boundary"),
      touchpointGrid: document.querySelector("#touchpoint-grid"),
      coverageInsight: document.querySelector("#coverage-insight"),
      relationshipInsight: document.querySelector("#relationship-insight"),
      priorityInsight: document.querySelector("#priority-insight"),
      guidanceList: document.querySelector("#guidance-list")
    };

    const raceConfig = {
      reach: {
        label: "Reach",
        description: "Build awareness and qualified visibility among people who may have a relevant need."
      },
      act: {
        label: "Act",
        description: "Encourage useful interactions that help prospects evaluate fit and signal genuine intent."
      },
      convert: {
        label: "Convert",
        description: "Enable an informed purchase, commitment or next step with a fair, clear experience."
      },
      engage: {
        label: "Engage",
        description: "Sustain value after conversion through service, retention, repeat use and voluntary advocacy."
      }
    };

    const loyaltyConfig = {
      prospect: {
        label: "Prospect",
        description: "A person or organisation exploring whether the brand is relevant to their need."
      },
      customer: {
        label: "Customer",
        description: "A first-time buyer or subscriber evaluating the experience against expectations."
      },
      client: {
        label: "Client",
        description: "A repeat customer with an established relationship and continued use."
      },
      supporter: {
        label: "Supporter",
        description: "A loyal customer who may voluntarily offer feedback, ideas or participation."
      },
      advocate: {
        label: "Advocate",
        description: "A customer who voluntarily recommends or refers the brand based on authentic experience."
      }
    };

    const channelConfig = {
      paid: "Paid media / retargeting",
      owned: "Owned media / direct experience",
      earned: "Earned media / community / referrals"
    };

    const priorityConfig = {
      high: "High priority",
      medium: "Medium priority",
      low: "Low priority"
    };

    const b2bPlan = [
      {
        id: "b2b-reach",
        race: "reach",
        loyalty: "prospect",
        channel: "earned",
        priority: "high",
        outcome: "Recognise a relevant planning challenge and understand the platform’s purpose, credibility and potential fit.",
        activity: "Publish useful thought leadership, practical examples and partner-led learning that makes the proposition discoverable without overclaiming.",
        measure: "Qualified reach, relevant organic visits, content usefulness and source quality",
        boundary: "Avoid collecting unnecessary personal data, publishing unsupported claims or presenting generic thought leadership as customer evidence."
      },
      {
        id: "b2b-act",
        race: "act",
        loyalty: "prospect",
        channel: "owned",
        priority: "high",
        outcome: "Explore how the platform could support a real workflow and decide whether a deeper conversation is worthwhile.",
        activity: "Offer accessible use-case guidance, a short self-assessment and an optional discovery conversation that respects the prospect’s time.",
        measure: "Qualified enquiries, content completion, useful interactions and voluntary follow-up",
        boundary: "Do not gate essential information, force a sales call or use pre-ticked consent to create leads."
      },
      {
        id: "b2b-convert",
        race: "convert",
        loyalty: "customer",
        channel: "owned",
        priority: "high",
        outcome: "Make a considered commitment with clear expectations about scope, pricing, implementation, data handling and support.",
        activity: "Provide transparent proposal materials, stakeholder-ready resources, accessible demos and a collaborative implementation plan.",
        measure: "Decision confidence, conversion quality, implementation readiness and early customer satisfaction",
        boundary: "Avoid artificial urgency, unclear renewals, hidden terms and claims that imply outcomes cannot be guaranteed."
      },
      {
        id: "b2b-engage",
        race: "engage",
        loyalty: "client",
        channel: "owned",
        priority: "high",
        outcome: "Achieve continued value through successful adoption, reliable support and improvements aligned with customer goals.",
        activity: "Use opt-in onboarding, customer success reviews, role-based learning, service recovery and relevant product communications.",
        measure: "Activation, retained usage, renewal, customer effort, outcome quality and support resolution",
        boundary: "Do not turn success communications into surveillance or pressure customers into feature adoption that does not serve their needs."
      },
      {
        id: "b2b-supporter",
        race: "engage",
        loyalty: "supporter",
        channel: "earned",
        priority: "medium",
        outcome: "Contribute feedback or peer learning when participation is genuinely useful and safe.",
        activity: "Invite customers into optional feedback sessions, learning exchanges and product councils; visibly explain what changed as a result.",
        measure: "Voluntary participation, feedback quality, follow-through and participant experience",
        boundary: "Do not extract unpaid labour, disclose sensitive organisational information or imply that participation affects service quality."
      },
      {
        id: "b2b-advocate",
        race: "engage",
        loyalty: "advocate",
        channel: "earned",
        priority: "medium",
        outcome: "Recommend the platform when it is genuinely appropriate for peers facing a similar challenge.",
        activity: "Make honest reviews, referrals and case-study participation optional; preserve the customer’s independent voice.",
        measure: "Voluntary referrals, recommendation relevance, referred-customer fit and authentic testimonials",
        boundary: "Do not script endorsements, reward undisclosed advocacy or suppress critical feedback."
      }
    ];

    const b2cPlan = [
      {
        id: "b2c-reach",
        race: "reach",
        loyalty: "prospect",
        channel: "paid",
        priority: "high",
        outcome: "Discover a relevant product and understand its real benefits, price, ingredients, delivery and environmental claims.",
        activity: "Use clear product storytelling through search, paid social, creator partnerships and useful organic content.",
        measure: "Qualified visits, reach to relevant audiences, cost per engaged visit and information usefulness",
        boundary: "Avoid greenwashing, hidden pricing, deceptive scarcity and targeting that exploits vulnerability."
      },
      {
        id: "b2c-act",
        race: "act",
        loyalty: "prospect",
        channel: "owned",
        priority: "high",
        outcome: "Compare products, understand how they work and decide whether they fit the customer’s household needs.",
        activity: "Provide comparison tools, reviews, ingredient details, delivery information, practical product guidance and preference-led email sign-up.",
        measure: "Product exploration, basket creation, content use, wishlist activity and voluntary sign-up",
        boundary: "Keep essential details accessible without forcing registration and make promotional consent separate from transactional needs."
      },
      {
        id: "b2c-convert",
        race: "convert",
        loyalty: "customer",
        channel: "owned",
        priority: "high",
        outcome: "Complete a first purchase confidently, receive accurate fulfilment and understand how to get help or return an item.",
        activity: "Create an accessible checkout, transparent delivery and returns process, order updates and helpful first-use information.",
        measure: "Checkout completion, order accuracy, delivery performance, first-order satisfaction and issue resolution",
        boundary: "Do not add hidden fees, use subscription traps or make returns and cancellations unnecessarily difficult."
      },
      {
        id: "b2c-engage",
        race: "engage",
        loyalty: "client",
        channel: "owned",
        priority: "high",
        outcome: "Maintain a convenient, relevant and affordable repeat-purchase relationship that continues to provide real value.",
        activity: "Offer flexible replenishment support, preference-led email, useful product education, service recovery and voluntary loyalty benefits.",
        measure: "Repeat purchase, retention, purchase interval, customer effort, satisfaction and cancellation reasons",
        boundary: "Make reminders optional, subscriptions easy to manage and personalisation understandable and controllable."
      },
      {
        id: "b2c-supporter",
        race: "engage",
        loyalty: "supporter",
        channel: "earned",
        priority: "medium",
        outcome: "Share useful feedback, product ideas or community knowledge when participation feels worthwhile.",
        activity: "Invite customers to optional product trials, feedback panels or community learning; clearly close the loop on feedback.",
        measure: "Voluntary participation, useful feedback, participant satisfaction and implemented improvements",
        boundary: "Do not make customers feel responsible for solving product problems or assume everyone has equal time and capacity to participate."
      },
      {
        id: "b2c-advocate",
        race: "engage",
        loyalty: "advocate",
        channel: "earned",
        priority: "medium",
        outcome: "Share an honest recommendation when the product has genuinely earned trust and is relevant to someone else.",
        activity: "Offer optional review and referral routes, disclose any incentives and ensure referred customers receive the same fair experience.",
        measure: "Voluntary reviews, referral quality, referred-customer satisfaction and recommendation authenticity",
        boundary: "Never require positive reviews, hide criticism or pay for endorsements without clear disclosure."
      }
    ];

    let plan = JSON.parse(JSON.stringify(b2bPlan));
    let activeRace = "reach";
    let activeLoyalty = "prospect";

    const shortText = (text, length = 100) => {
      const clean = String(text || "").replace(/\s+/g, " ").trim();
      return clean.length > length ? `${clean.slice(0, length - 1)}…` : clean;
    };

    const findActivity = ({ race, loyalty }) => {
      return (
        plan.find((item) => item.race === race && item.loyalty === loyalty) ||
        plan.find((item) => item.race === race) ||
        plan.find((item) => item.loyalty === loyalty) ||
        null
      );
    };

    const populateForm = (activity) => {
      if (!activity) return;

      fields.loyaltyStage.value = activity.loyalty;
      fields.raceStage.value = activity.race;
      fields.channel.value = activity.channel;
      fields.priority.value = activity.priority;
      fields.outcome.value = activity.outcome;
      fields.activity.value = activity.activity;
      fields.measure.value = activity.measure;
      fields.boundary.value = activity.boundary;
    };

    const selectMoment = ({ race, loyalty, populate = true }) => {
      activeRace = race;
      activeLoyalty = loyalty;

      const activity = findActivity({ race, loyalty });
      if (populate && activity) populateForm(activity);

      renderWorkspace();
    };

    const selectRace = (race) => {
      const activity = plan.find((item) => item.race === race) || plan[0];
      selectMoment({ race, loyalty: activity.loyalty });
    };

    const selectLoyalty = (loyalty) => {
      const activity = plan.find((item) => item.loyalty === loyalty) || plan[0];
      selectMoment({ race: activity.race, loyalty });
    };

    const renderWorkspace = () => {
      const selected = findActivity({ race: activeRace, loyalty: activeLoyalty });
      const selectedRace = raceConfig[activeRace];
      const selectedLoyalty = loyaltyConfig[activeLoyalty];

      display.detailTitle.textContent = `${selectedRace.label} · ${selectedLoyalty.label}`;
      display.detailOutcome.textContent =
        selected?.outcome ||
        "No planned activity is saved for this lifecycle combination.";

      display.detailActivity.textContent =
        selected?.activity || "No always-on activity has been added.";

      display.detailChannel.textContent = selected
        ? `${channelConfig[selected.channel]} · ${priorityConfig[selected.priority]}`
        : "Not assigned";

      display.detailMeasure.textContent =
        selected?.measure || "No customer-centred measure has been added.";

      display.detailBoundary.textContent =
        selected?.boundary || "No experience or ethical boundary has been added.";

      Object.keys(raceConfig).forEach((race) => {
        const activities = plan.filter((item) => item.race === race);
        const card = document.querySelector(`[data-race="${race}"]`);
        const summary = document.querySelector(`#${race}-summary`);
        const status = document.querySelector(`#${race}-status`);
        const selectedCard = race === activeRace;

        card.classList.toggle("selected", selectedCard);
        card.classList.toggle("dimmed", Boolean(activeRace && !selectedCard));
        summary.textContent = activities.length
          ? shortText(activities[0].activity, 103)
          : "No activity mapped.";
        status.textContent = activities.length
          ? `${activities.length} mapped`
          : "Not planned";
      });

      Object.keys(loyaltyConfig).forEach((stage) => {
        const activities = plan.filter((item) => item.loyalty === stage);
        const rung = document.querySelector(`[data-stage="${stage}"]`);
        const summary = document.querySelector(`#${stage}-summary`);
        const status = document.querySelector(`#${stage}-status`);
        const selectedRung = stage === activeLoyalty;

        rung.classList.toggle("selected", selectedRung);
        rung.classList.toggle("dimmed", Boolean(activeLoyalty && !selectedRung));
        summary.textContent = activities.length
          ? shortText(activities[0].outcome, 102)
          : "No activity mapped.";
        status.textContent = activities.length
          ? `${activities.length} mapped`
          : "Not planned";
      });

      renderTouchpoints();
      renderGaps();
      renderInsights();
      renderGuidance();
    };

    const renderTouchpoints = () => {
      display.touchpointGrid.querySelectorAll(".grid-label, .touchpoint").forEach((node) => node.remove());

      const rows = [
        {
          key: "paid",
          label: "Paid media",
          defaults: {
            reach: ["Search and paid social", "Build relevant awareness"],
            act: ["Retargeting and lead ads", "Prompt useful next steps"],
            convert: ["Conversion support", "Use carefully and transparently"],
            engage: ["Selective re-engagement", "Avoid intrusive repetition"]
          }
        },
        {
          key: "owned",
          label: "Owned media",
          defaults: {
            reach: ["SEO and useful content", "Make information discoverable"],
            act: ["Website, email and tools", "Support evaluation"],
            convert: ["Checkout, sales and onboarding", "Enable a fair commitment"],
            engage: ["Service, CRM and community", "Sustain customer value"]
          }
        },
        {
          key: "earned",
          label: "Earned media",
          defaults: {
            reach: ["Partners, PR and creators", "Build credible awareness"],
            act: ["Reviews and peer proof", "Support informed evaluation"],
            convert: ["Trusted recommendations", "Reduce uncertainty honestly"],
            engage: ["Reviews, referrals and community", "Enable voluntary advocacy"]
          }
        }
      ];

      rows.forEach((row) => {
        const label = document.createElement("div");
        label.className = "grid-label";
        label.textContent = row.label;
        display.touchpointGrid.appendChild(label);

        Object.keys(raceConfig).forEach((race) => {
          const activities = plan.filter(
            (item) => item.channel === row.key && item.race === race
          );

          const cell = document.createElement("div");
          cell.className = `touchpoint ${activities.length ? "active" : ""}`;
          cell.dataset.channel = row.key;

          const fallback = row.defaults[race];
          const text = activities.length
            ? shortText(activities[0].activity, 62)
            : fallback[1];

          cell.innerHTML = `
            <strong>${activities.length ? "Mapped activity" : fallback[0]}</strong>
            <span>${text}</span>
          `;

          display.touchpointGrid.appendChild(cell);
        });
      });
    };

    const renderGaps = () => {
      const requiredPerStage = 2;

      Object.keys(raceConfig).forEach((race) => {
        const count = plan.filter((item) => item.race === race).length;
        const score = Math.min(100, Math.round((count / requiredPerStage) * 100));

        document.querySelector(`#${race}-gap`).textContent = `${score}%`;
        document.querySelector(`#${race}-gap-bar`).style.width = `${score}%`;

        const note = document.querySelector(`#${race}-gap-note`);

        if (count === 0) {
          note.textContent = "No activity mapped — investigate the customer need and likely friction.";
        } else if (count === 1) {
          note.textContent = "One activity mapped — consider whether a second route or service improvement is needed.";
        } else {
          note.textContent = `${count} activities mapped — review quality, overlap and customer relevance.`;
        }
      });

      const plannedCore = Object.keys(raceConfig).filter(
        (race) => plan.some((item) => item.race === race)
      ).length;

      const plannedLoyalty = Object.keys(loyaltyConfig).filter(
        (stage) => plan.some((item) => item.loyalty === stage)
      ).length;

      display.coverageScore.textContent = `${plannedCore + plannedLoyalty}/9`;
    };

    const renderInsights = () => {
      const total = plan.length;
      const highPriority = plan.filter((item) => item.priority === "high").length;
      const engageCount = plan.filter((item) => item.race === "engage").length;
      const missingRace = Object.keys(raceConfig).filter(
        (race) => !plan.some((item) => item.race === race)
      );

      display.coverageInsight.innerHTML =
        `<strong>${total} lifecycle activities are mapped.</strong> ${
          missingRace.length
            ? `Coverage is missing in ${missingRace.map((stage) => raceConfig[stage].label).join(", ")}.`
            : "Each RACE stage has at least one activity; now assess customer relevance and operational quality."
        }`;

      display.relationshipInsight.innerHTML =
        `<strong>${engageCount} activities focus on Engage.</strong> Retention and loyalty grow from sustained value, support, trust and customer control—not from message frequency alone.`;

      display.priorityInsight.innerHTML =
        `<strong>${highPriority} activity${highPriority === 1 ? "" : "ies"} marked high priority.</strong> Choose a small number of improvements, define a customer-centred success measure and review results before scaling.`;
    };

    const renderGuidance = () => {
      const guidance = [
        "Plan for the complete relationship. Reach and conversion matter, but post-purchase adoption, service quality, retention, lapse and re-engagement are part of the same customer system.",
        "Use always-on activity where customers need it: search visibility, useful content, preference-led email, accessible journeys, customer support and service recovery often work best as ongoing capabilities.",
        "Coordinate paid, owned and earned channels. Their roles differ, but the customer should encounter consistent information, expectations and controls across them.",
        "Personalise only when it creates a clear customer benefit. Explain data use, minimise collection, respect consent and make preference changes or unsubscribing straightforward.",
        "Segment responsibly. B2B buying groups, B2C households and individuals have different motivations and accessibility needs; avoid treating a CRM label as a complete picture of a person.",
        "Measure outcomes as well as volume: customer effort, task success, retained value, repeat purchase, support resolution, accessibility, satisfaction and voluntary advocacy can be more meaningful than opens or clicks.",
        "Treat advocates as independent customers, not a free media channel. Referrals, reviews and stories should be voluntary, truthful and transparently disclosed where incentives exist."
      ];

      display.guidanceList.innerHTML = "";

      guidance.forEach((tip) => {
        const item = document.createElement("li");
        item.innerHTML =
          `<span class="guidance-icon" aria-hidden="true">✓</span><span>${tip}</span>`;
        display.guidanceList.appendChild(item);
      });
    };

    const saveActivity = () => {
      const race = fields.raceStage.value;
      const loyalty = fields.loyaltyStage.value;

      const record = {
        id: `activity-${Date.now()}`,
        race,
        loyalty,
        channel: fields.channel.value,
        priority: fields.priority.value,
        outcome: fields.outcome.value.trim(),
        activity: fields.activity.value.trim(),
        measure: fields.measure.value.trim(),
        boundary: fields.boundary.value.trim()
      };

      const exactIndex = plan.findIndex(
        (item) => item.race === race && item.loyalty === loyalty
      );

      if (exactIndex >= 0) {
        plan[exactIndex] = { ...plan[exactIndex], ...record, id: plan[exactIndex].id };
      } else {
        plan.push(record);
      }

      activeRace = race;
      activeLoyalty = loyalty;
      renderWorkspace();
    };

    const clearEntry = () => {
      fields.outcome.value = "";
      fields.activity.value = "";
      fields.measure.value = "";
      fields.boundary.value = "";
      fields.outcome.focus();
    };

    const setMode = (mode) => {
      fields.mode.value = mode;

      document.querySelectorAll(".mode-button").forEach((button) => {
        button.classList.toggle("active", button.dataset.mode === mode);
      });
    };

    const loadDemo = (demo) => {
      if (demo === "b2b") {
        fields.brand.value = "Collaborative research-impact planning platform";
        plan = JSON.parse(JSON.stringify(b2bPlan));
        setMode("b2b");
      }

      if (demo === "b2c") {
        fields.brand.value = "Refillable lower-waste household products brand";
        plan = JSON.parse(JSON.stringify(b2cPlan));
        setMode("b2c");
      }

      if (demo === "services") {
        fields.brand.value = "Evidence and communications advisory practice";
        plan = [
          {
            id: "services-reach",
            race: "reach",
            loyalty: "prospect",
            channel: "earned",
            priority: "high",
            outcome: "Recognise a relevant challenge and understand the practice’s expertise, approach and boundaries.",
            activity: "Publish useful perspectives, transparent service information and context-rich examples through search, professional networks and trusted partnerships.",
            measure: "Qualified visibility, relevant enquiries, content usefulness and partner referrals",
            boundary: "Avoid overstating results, using client information without permission or turning complex work into simplistic promises."
          },
          {
            id: "services-act",
            race: "act",
            loyalty: "prospect",
            channel: "owned",
            priority: "high",
            outcome: "Explore whether the service is relevant without committing to a lengthy sales process or sharing unnecessary sensitive information.",
            activity: "Offer a clear service guide, accessible discovery resources and optional short consultation focused on the prospect’s context.",
            measure: "Discovery usefulness, qualified enquiry quality and informed next-step decisions",
            boundary: "Do not gate key decision information, use high-pressure follow-up or assume every enquiry should become a sale."
          },
          {
            id: "services-convert",
            race: "convert",
            loyalty: "customer",
            channel: "owned",
            priority: "high",
            outcome: "Enter a project with clear scope, responsibilities, pricing, methods, accessibility arrangements and routes to raise concerns.",
            activity: "Use collaborative scoping, transparent proposals, realistic timelines and an accessible project-start process.",
            measure: "Decision confidence, onboarding satisfaction, scope clarity and time to first useful output",
            boundary: "Avoid ambiguous deliverables, hidden dependencies and incentives that prioritise sales over suitability."
          },
          {
            id: "services-engage",
            race: "engage",
            loyalty: "client",
            channel: "owned",
            priority: "high",
            outcome: "Sustain a useful relationship that builds client capability and addresses changing needs without creating dependency.",
            activity: "Offer reflective reviews, optional learning, service recovery and context-appropriate follow-on support.",
            measure: "Client capability, retained value, repeat engagement, project outcomes and customer effort",
            boundary: "Recommend further work only where it is genuinely helpful; do not manufacture complexity or withhold knowledge."
          },
          {
            id: "services-advocate",
            race: "engage",
            loyalty: "advocate",
            channel: "earned",
            priority: "medium",
            outcome: "Refer peers or share an honest testimonial only when the service has genuinely earned their confidence.",
            activity: "Make referrals and case-study participation optional, preserve the customer’s voice and seek informed permission before sharing stories.",
            measure: "Voluntary referrals, testimonial authenticity, referred-client fit and long-term reputation",
            boundary: "Do not script endorsements, reward undisclosed advocacy or pressure clients to share sensitive organisational experiences."
          }
        ];
        setMode("b2b");
      }

      fields.demo.value = demo;
      const first = plan[0];
      selectMoment({ race: first.race, loyalty: first.loyalty });
    };

    const copyPlan = async () => {
      const brand = fields.brand.value.trim() || "Brand / service not specified.";

      const lines = [
        "CUSTOMER LIFECYCLE & LOYALTY PLAN",
        "",
        `Brand / service: ${brand}`,
        `Lifecycle context: ${fields.mode.value === "b2b" ? "B2B / complex consideration" : "B2C / ecommerce and repeat purchase"}`,
        ""
      ];

      Object.keys(raceConfig).forEach((race) => {
        lines.push(`${raceConfig[race].label.toUpperCase()} — ${raceConfig[race].description}`);

        const activities = plan.filter((item) => item.race === race);

        if (!activities.length) {
          lines.push("No activity mapped.");
        }

        activities.forEach((item) => {
          lines.push(`Loyalty stage: ${loyaltyConfig[item.loyalty].label}`);
          lines.push(`Channel: ${channelConfig[item.channel]}`);
          lines.push(`Priority: ${priorityConfig[item.priority]}`);
          lines.push(`Customer outcome: ${item.outcome}`);
          lines.push(`Always-on activity: ${item.activity}`);
          lines.push(`Measure: ${item.measure}`);
          lines.push(`Boundary: ${item.boundary}`);
          lines.push("");
        });
      });

      lines.push(
        "Planning note: Lifecycle marketing should provide relevant, transparent and controllable customer experiences across the full relationship, including post-purchase support, retention, lapse and voluntary advocacy."
      );

      const button = document.querySelector("#copy-plan");
      const originalLabel = button.textContent;

      try {
        await navigator.clipboard.writeText(lines.join("\n"));
        button.textContent = "Plan copied";
      } catch {
        button.textContent = "Copy unavailable";
      }

      window.setTimeout(() => {
        button.textContent = originalLabel;
      }, 1800);
    };

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      saveActivity();
    });

    document.querySelector("#clear-entry").addEventListener("click", clearEntry);
    document.querySelector("#copy-plan").addEventListener("click", copyPlan);

    fields.demo.addEventListener("change", (event) => {
      if (event.target.value) loadDemo(event.target.value);
    });

    fields.raceStage.addEventListener("change", () => {
      const activity = findActivity({
        race: fields.raceStage.value,
        loyalty: fields.loyaltyStage.value
      });

      if (activity) populateForm(activity);
    });

    fields.loyaltyStage.addEventListener("change", () => {
      const activity = findActivity({
        race: fields.raceStage.value,
        loyalty: fields.loyaltyStage.value
      });

      if (activity) populateForm(activity);
    });

    document.querySelectorAll(".mode-button").forEach((button) => {
      button.addEventListener("click", () => {
        const mode = button.dataset.mode;
        setMode(mode);

        if (mode === "b2b") loadDemo("b2b");
        if (mode === "b2c") loadDemo("b2c");
      });
    });

    document.querySelectorAll(".race-stage").forEach((button) => {
      button.addEventListener("click", () => {
        selectRace(button.dataset.race);
      });
    });

    document.querySelectorAll(".loyalty-rung").forEach((button) => {
      button.addEventListener("click", () => {
        selectLoyalty(button.dataset.stage);
      });
    });

    selectMoment({ race: "reach", loyalty: "prospect" });

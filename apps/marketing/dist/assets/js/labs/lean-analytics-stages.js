const form = document.querySelector("#analytics-form");

    const fields = {
      venture: document.querySelector("#venture-name"),
      stage: document.querySelector("#stage-selector"),
      hypothesis: document.querySelector("#hypothesis"),
      metric: document.querySelector("#metric"),
      threshold: document.querySelector("#threshold"),
      experiment: document.querySelector("#experiment"),
      nextAction: document.querySelector("#next-action"),
      demoPicker: document.querySelector("#demo-picker")
    };

    const display = {
      currentBadge: document.querySelector("#current-stage-badge"),
      focusTitle: document.querySelector("#focus-title"),
      focusDescription: document.querySelector("#focus-description"),
      focusQuestion: document.querySelector("#focus-question"),
      focusEvidence: document.querySelector("#focus-evidence"),
      focusGate: document.querySelector("#focus-gate"),
      focusMetric: document.querySelector("#focus-metric"),
      progressText: document.querySelector("#progress-text"),
      progressFill: document.querySelector("#progress-fill"),
      experimentInsight: document.querySelector("#experiment-insight"),
      thresholdInsight: document.querySelector("#threshold-insight"),
      nextActionInsight: document.querySelector("#next-action-insight"),
      experimentList: document.querySelector("#experiment-list")
    };

    const stageConfig = {
      empathy: {
        label: "Empathy",
        description:
          "Understand a real, poorly served customer problem and test whether your proposed approach resonates before building extensively.",
        question:
          "Is this problem frequent, painful and important enough for a reachable group of people?",
        evidence:
          "Problem interviews, observation, existing workarounds, willingness-to-test and willingness-to-pay signals.",
        gate:
          "Clear evidence of a real problem, a defined early audience and enough interest to test a narrow solution.",
        defaultMetric:
          "Validated problem interviews or committed prototype tests"
      },
      stickiness: {
        label: "Stickiness",
        description:
          "Test whether early users repeatedly gain value from the core product or service, rather than simply trying it once.",
        question:
          "Do the right users return and complete the core value-generating activity often enough?",
        evidence:
          "Activation, cohort retention, repeat-use frequency, task completion, churn reasons and qualitative feedback.",
        gate:
          "A meaningful cohort returns and uses the core value proposition repeatedly, with a clear understanding of why.",
        defaultMetric:
          "Cohort retention and repeat core-action rate"
      },
      virality: {
        label: "Virality",
        description:
          "Identify repeatable growth loops—such as referrals, sharing, content or network effects—only where they fit the product and market.",
        question:
          "Can satisfied users or product use reliably generate new, high-quality users at reasonable cost?",
        evidence:
          "Referral rate, invite conversion, viral coefficient, organic acquisition, channel quality and new-user retention.",
        gate:
          "At least one repeatable acquisition channel or loop generates users who behave like successful early users.",
        defaultMetric:
          "Referral conversion or qualified organic acquisition"
      },
      revenue: {
        label: "Revenue",
        description:
          "Prove that the offer can create sustainable value exchange, with customers paying enough to support the delivery and acquisition model.",
        question:
          "Will customers pay in a way that produces viable margins and an acceptable route to sustainable economics?",
        evidence:
          "Trial-to-paid conversion, willingness to pay, ARPU, gross margin, customer lifetime value and acquisition payback.",
        gate:
          "A credible monetisation model with repeatable conversion, sensible margins and a path to sustainable unit economics.",
        defaultMetric:
          "Paid conversion, ARPU, margin and payback period"
      },
      scale: {
        label: "Scale",
        description:
          "Expand efficiently once the core product and economic engine are proven, while protecting quality, retention and customer trust.",
        question:
          "Can the business grow across customers, channels, geographies or products without breaking unit economics or experience quality?",
        evidence:
          "CAC payback, operational capacity, retention by segment, revenue growth, margin, service quality and channel efficiency.",
        gate:
          "Growth remains efficient and repeatable, with operating capability and economics that support expansion.",
        defaultMetric:
          "Efficient growth, payback, retention and operational capacity"
      }
    };

    let plans = {
      empathy: {
        hypothesis:
          "Research-development and impact professionals struggle to turn broad impact ambitions into practical, shared plans, and will engage with a collaborative visual workspace that structures this work.",
        metric:
          "Number of interviewees who describe the planning problem as frequent, painful and currently poorly served",
        threshold:
          "At least 12 of 15 relevant interviewees describe a recurring problem and agree to test a prototype",
        experiment:
          "Conduct semi-structured problem interviews with research-development staff and principal investigators; use a simple interactive prototype to test whether the proposed workflow is understandable and useful.",
        nextAction:
          "Build a narrow MVP focused on stakeholder mapping, pathway design and collaborative export, then test whether early users return to complete a second planning task."
      },
      stickiness: {
        hypothesis:
          "Early users will return to use the planning workspace when they are preparing a bid, designing a project or coordinating an impact discussion.",
        metric:
          "Week-4 retention among activated pilot users who create, share and revisit at least one impact-planning workspace",
        threshold:
          "At least 40% of activated pilot users return in week 4 and complete a second meaningful planning action",
        experiment:
          "Run a six-week pilot with a small cohort; track activation, repeated use, completed maps, collaboration invitations and qualitative reasons for return or drop-off.",
        nextAction:
          "Refine onboarding and the core planning workflow around the repeated value moment before investing materially in broader acquisition."
      },
      virality: {
        hypothesis:
          "Shared workspaces and exportable outputs will create natural invitations among research teams and professional-services colleagues.",
        metric:
          "Percentage of activated workspaces that generate an invited collaborator who becomes an activated user",
        threshold:
          "At least 25% of activated workspaces invite a collaborator, and at least half of invited collaborators activate",
        experiment:
          "Test contextual collaboration prompts, shareable read-only outputs and team templates with pilot users; compare invitation behaviour and invited-user activation.",
        nextAction:
          "Develop the strongest collaboration loop and test it with a narrow acquisition channel before increasing promotion spend."
      },
      revenue: {
        hypothesis:
          "Research-development teams will pay for collaborative features, reusable templates, governance controls and support once the tool demonstrates recurring planning value.",
        metric:
          "Pilot-to-paid conversion and annual contract value relative to onboarding, support and acquisition costs",
        threshold:
          "At least 30% of eligible pilot organisations convert to a paid plan at a price that supports a viable gross margin",
        experiment:
          "Offer a paid team plan with clear value tiers after the pilot; conduct structured pricing conversations and track conversion, objections and use by role.",
        nextAction:
          "Confirm pricing, package boundaries and sales motion, then test acquisition-payback assumptions with a small repeatable pipeline."
      },
      scale: {
        hypothesis:
          "The product can grow across institutions and adjacent research-planning use cases without weakening activation, retention, support quality or economics.",
        metric:
          "Customer acquisition payback, net revenue retention, activation by segment and support capacity per customer",
        threshold:
          "New cohorts retain at comparable levels, payback remains within the agreed period and support demand stays within planned capacity",
        experiment:
          "Expand through a limited set of university partnerships and track performance by institution, segment, channel, onboarding model and support requirement.",
        nextAction:
          "Scale only the channels, segments and operational systems that preserve customer value and unit economics."
      }
    };

    let activeStage = "empathy";

    const shortText = (text, length = 150) => {
      const clean = String(text || "").replace(/\s+/g, " ").trim();
      return clean.length > length ? `${clean.slice(0, length - 1)}…` : clean;
    };

    const hasPlan = (stage) => {
      const plan = plans[stage];
      return Boolean(
        plan &&
        [plan.hypothesis, plan.metric, plan.threshold, plan.experiment, plan.nextAction]
          .some((value) => String(value || "").trim())
      );
    };

    const populateStageForm = (stage) => {
      const plan = plans[stage] || {};

      fields.stage.value = stage;
      fields.hypothesis.value = plan.hypothesis || "";
      fields.metric.value = plan.metric || "";
      fields.threshold.value = plan.threshold || "";
      fields.experiment.value = plan.experiment || "";
      fields.nextAction.value = plan.nextAction || "";
    };

    const selectStage = (stage) => {
      activeStage = stage;
      populateStageForm(stage);
      renderDashboard();
    };

    const renderDashboard = () => {
      const config = stageConfig[activeStage];
      const currentPlan = plans[activeStage] || {};

      display.currentBadge.textContent = config.label;
      display.focusTitle.textContent = config.label;
      display.focusDescription.textContent = config.description;
      display.focusQuestion.textContent = config.question;
      display.focusEvidence.textContent = config.evidence;
      display.focusGate.textContent = config.gate;
      display.focusMetric.textContent = currentPlan.metric || config.defaultMetric;

      Object.keys(stageConfig).forEach((stage) => {
        const button = document.querySelector(`[data-stage="${stage}"]`);
        const status = document.querySelector(`#${stage}-status`);
        const isActive = stage === activeStage;
        const planned = hasPlan(stage);

        button.setAttribute("aria-pressed", String(isActive));
        button.classList.toggle("dimmed", Boolean(activeStage && !isActive));
        button.classList.toggle("completed", planned);
        status.textContent = planned ? "Experiment planned" : "Not planned";
      });

      const plannedCount = Object.keys(stageConfig).filter(hasPlan).length;
      const progress = (plannedCount / 5) * 100;

      display.progressText.textContent = `${plannedCount} of 5 stages planned`;
      display.progressFill.style.width = `${progress}%`;

      document.querySelector(".progress-bar").setAttribute("aria-valuenow", plannedCount);

      display.experimentInsight.innerHTML = currentPlan.experiment
        ? `<strong>${config.label} experiment:</strong> ${shortText(currentPlan.experiment, 190)}`
        : "Add a stage experiment to define the smallest useful learning activity.";

      display.thresholdInsight.innerHTML = currentPlan.threshold
        ? `<strong>Decision rule:</strong> ${shortText(currentPlan.threshold, 180)}`
        : "Specify the result that will lead you to advance, iterate or stop.";

      display.nextActionInsight.innerHTML = currentPlan.nextAction
        ? `<strong>If supported:</strong> ${shortText(currentPlan.nextAction, 180)}`
        : "Keep the next action tied to what you learn, rather than a predetermined roadmap.";

      const habits = [
        "Start with a decision, not a dashboard: state what uncertainty this metric is meant to reduce.",
        "Use a small, credible experiment before committing large budgets, extensive build effort or irreversible choices.",
        "Pair quantitative signals with qualitative observation—numbers can tell you what happened, but not always why.",
        "Avoid vanity metrics that look impressive but do not change a product, customer or investment decision.",
        "Set a threshold in advance, including what you will do if the evidence is weaker, mixed or stronger than expected.",
        "Respect privacy and consent: collect only data you need, explain its use and avoid manipulative growth tactics."
      ];

      display.experimentList.innerHTML = "";
      habits.forEach((habit) => {
        const item = document.createElement("li");
        item.innerHTML =
          `<span class="experiment-icon" aria-hidden="true">?</span><span>${habit}</span>`;
        display.experimentList.appendChild(item);
      });
    };

    const saveStagePlan = () => {
      const stage = fields.stage.value;

      plans[stage] = {
        hypothesis: fields.hypothesis.value.trim(),
        metric: fields.metric.value.trim(),
        threshold: fields.threshold.value.trim(),
        experiment: fields.experiment.value.trim(),
        nextAction: fields.nextAction.value.trim()
      };

      activeStage = stage;
      renderDashboard();
    };

    const clearStage = () => {
      fields.hypothesis.value = "";
      fields.metric.value = "";
      fields.threshold.value = "";
      fields.experiment.value = "";
      fields.nextAction.value = "";
      fields.hypothesis.focus();
    };

    const loadDemo = (demo) => {
      const demos = {
        "research-saas": {
          venture: "Collaborative research-impact planning software",
          plans
        },

        "climate-service": {
          venture: "Climate and Earth-observation communications consultancy",
          plans: {
            empathy: {
              hypothesis:
                "Public-sector climate and place teams struggle to turn technical Earth-observation evidence into materials that are credible, understandable and useful in stakeholder decision-making.",
              metric:
                "Interviewees who identify evidence translation and stakeholder engagement as a recurring, insufficiently served challenge",
              threshold:
                "At least 10 of 14 relevant interviewees describe a high-priority need and agree to review or co-design a lightweight service prototype",
              experiment:
                "Interview climate, adaptation, place and public-engagement leads; test a concise service concept and sample interactive output against their current approaches.",
              nextAction:
                "Offer a paid or tightly scoped pilot focused on one decision context, audience and piece of Earth-observation evidence."
            },
            stickiness: {
              hypothesis:
                "Clients will return for follow-on work when the consultancy process creates usable tools, shared understanding and clearer decisions rather than a one-off report.",
              metric:
                "Repeat engagements, referrals and use of delivered tools within six months of the initial project",
              threshold:
                "At least half of pilot clients use a delivered output in a real decision or engagement activity, with several requesting follow-on support or making referrals",
              experiment:
                "Run two to three scoped projects, conduct post-project interviews and observe how outputs are reused in workshops, communications or planning discussions.",
              nextAction:
                "Standardise the most valuable delivery components and create a repeatable client journey around them."
            },
            virality: {
              hypothesis:
                "High-quality interactive outputs and practical workshops will generate referrals through professional networks and partner organisations.",
              metric:
                "Share of qualified opportunities originating from client, partner or event referrals",
              threshold:
                "Referral-generated opportunities become a consistent source of qualified work and convert at least as well as direct outreach",
              experiment:
                "Build simple referral prompts into project close-out, publish permissioned case studies and track origin, quality and conversion of every enquiry.",
              nextAction:
                "Invest selectively in the networks, events and partners that produce high-fit referrals."
            },
            revenue: {
              hypothesis:
                "Clients will pay for clearly scoped packages when value is linked to a real engagement, decision, programme or funding need.",
              metric:
                "Proposal acceptance rate, average project value, gross margin and time from first conversation to paid engagement",
              threshold:
                "A repeatable package converts at a sustainable price while covering delivery time, partner costs and business-development effort",
              experiment:
                "Test three package levels with transparent scope and pricing; compare buyer response, delivery effort, margin and perceived value.",
              nextAction:
                "Concentrate on the packages and segments with credible margins, clear outcomes and repeatable sales conversations."
            },
            scale: {
              hypothesis:
                "The service can grow through a networked delivery model, reusable tools and specialist partnerships without compromising quality or responsible evidence use.",
              metric:
                "Revenue per delivery lead, gross margin, repeat work, project quality and partner capacity",
              threshold:
                "Growth in projects and revenue occurs without longer delivery cycles, declining client outcomes or unsustainable dependence on a small number of individuals",
              experiment:
                "Test reusable workshop formats, delivery playbooks and a small partner network across several projects and track quality, cost and capacity.",
              nextAction:
                "Scale only the delivery model, partnerships and offer components that preserve quality, ethics and commercial viability."
            }
          }
        },

        "marketplace": {
          venture: "Local skills and services marketplace",
          plans: {
            empathy: {
              hypothesis:
                "Local residents and small service providers struggle to find trusted, affordable and available help for short practical jobs.",
              metric:
                "Interviewees reporting a recent unmet need, costly workaround or low trust in existing discovery options",
              threshold:
                "A clear early market exists on both demand and supply sides, with enough people willing to test a narrowly focused local marketplace",
              experiment:
                "Interview residents and providers in one local area; manually match a small set of requests to providers to learn what creates trust and successful completion.",
              nextAction:
                "Run a concierge MVP for one service category and postcode area before building broad marketplace functionality."
            },
            stickiness: {
              hypothesis:
                "People will return when the marketplace consistently provides reliable matches, clear pricing and safe communication.",
              metric:
                "Repeat request rate, repeat provider participation and completed-job satisfaction",
              threshold:
                "A meaningful share of successful customers return or refer within a defined period, while providers receive enough quality demand to stay active",
              experiment:
                "Operate a manual pilot with post-job feedback, structured issue resolution and a narrow category focus; track successful completion and repeat behaviour.",
              nextAction:
                "Improve the weakest point in the request-to-completion journey before spending significantly on acquisition."
            },
            virality: {
              hypothesis:
                "Successful jobs will generate local word-of-mouth and provider invitations that bring in similarly high-quality users.",
              metric:
                "Referral-driven requests, provider invitations and completion rate for referred users",
              threshold:
                "Referred users complete jobs at comparable or better rates than other acquisition sources and referrals represent a growing share of demand or supply",
              experiment:
                "Test transparent referral incentives, shareable completion confirmations and provider invite flows; monitor quality, fraud and retention.",
              nextAction:
                "Keep only referral loops that improve marketplace liquidity and trust rather than producing low-quality sign-ups."
            },
            revenue: {
              hypothesis:
                "Users will accept a transparent service fee or provider commission if the marketplace saves time and increases trust.",
              metric:
                "Fee acceptance, take rate, contribution margin per completed job and customer-support cost",
              threshold:
                "Completed transactions produce a positive contribution margin after support, payment and trust-and-safety costs",
              experiment:
                "Test fee structures with clear explanation of value; compare completed bookings, satisfaction, provider supply and unit contribution.",
              nextAction:
                "Refine the business model around the fee structure and categories that create sustainable economics without undermining trust."
            },
            scale: {
              hypothesis:
                "The marketplace can expand to adjacent areas and categories while maintaining liquidity, safety, support quality and efficient acquisition.",
              metric:
                "Jobs completed per area, time to match, CAC payback, dispute rate, provider availability and contribution margin",
              threshold:
                "New areas reach sufficient liquidity within the planned timeframe without degrading trust metrics or relying on unsustainable incentives",
              experiment:
                "Launch sequentially in a limited number of new areas, comparing supply density, demand, match time, trust outcomes and economics.",
              nextAction:
                "Scale only locations and categories where liquidity, trust and unit economics are demonstrably repeatable."
            }
          }
        }
      };

      const selected = demos[demo];
      if (!selected) return;

      fields.venture.value = selected.venture;
      plans = JSON.parse(JSON.stringify(selected.plans));
      fields.demoPicker.value = demo;

      selectStage("empathy");
    };

    const copyPlan = async () => {
      const venture = fields.venture.value.trim() || "Venture not specified.";

      const lines = [
        "LEAN ANALYTICS LEARNING PLAN",
        "",
        `Venture: ${venture}`,
        ""
      ];

      Object.entries(stageConfig).forEach(([stage, config]) => {
        const plan = plans[stage] || {};

        lines.push(`${config.label.toUpperCase()} — ${config.question}`);
        lines.push(`Hypothesis: ${plan.hypothesis || "Not added."}`);
        lines.push(`One metric that matters: ${plan.metric || config.defaultMetric}`);
        lines.push(`Decision threshold: ${plan.threshold || "Not added."}`);
        lines.push(`Experiment: ${plan.experiment || "Not added."}`);
        lines.push(`Next action if supported: ${plan.nextAction || "Not added."}`);
        lines.push("");
      });

      lines.push(
        "Planning note: Treat every stage as a testable learning loop. Use ethical data practices and revise the plan when evidence contradicts the original assumption."
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
      saveStagePlan();
    });

    fields.stage.addEventListener("change", () => {
      selectStage(fields.stage.value);
    });

    fields.venture.addEventListener("input", renderDashboard);

    fields.demoPicker.addEventListener("change", (event) => {
      if (event.target.value) loadDemo(event.target.value);
    });

    document.querySelector("#clear-stage").addEventListener("click", clearStage);
    document.querySelector("#copy-plan").addEventListener("click", copyPlan);

    document.querySelectorAll(".stage-button").forEach((button) => {
      button.addEventListener("click", () => {
        selectStage(button.dataset.stage);
      });
    });

    selectStage("empathy");

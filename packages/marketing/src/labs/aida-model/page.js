const form = document.querySelector("#aida-form");

    const fields = {
      campaign: document.querySelector("#campaign-name"),
      stage: document.querySelector("#stage-selector"),
      task: document.querySelector("#audience-task"),
      message: document.querySelector("#core-message"),
      touchpoint: document.querySelector("#touchpoint"),
      cta: document.querySelector("#cta"),
      measure: document.querySelector("#measure"),
      demoPicker: document.querySelector("#demo-picker")
    };

    const display = {
      coverageScore: document.querySelector("#coverage-score"),
      detailTitle: document.querySelector("#detail-title"),
      detailTask: document.querySelector("#detail-task"),
      detailMessage: document.querySelector("#detail-message"),
      detailTouchpoint: document.querySelector("#detail-touchpoint"),
      detailCta: document.querySelector("#detail-cta"),
      detailMeasure: document.querySelector("#detail-measure"),
      coverageInsight: document.querySelector("#coverage-insight"),
      messageInsight: document.querySelector("#message-insight"),
      measurementInsight: document.querySelector("#measurement-insight"),
      guidanceList: document.querySelector("#guidance-list")
    };

    const stageConfig = {
      awareness: {
        label: "Awareness / Attention",
        prompt:
          "How will the right audience first notice and recognise the offer or issue in a credible, relevant setting?",
        metric:
          "Relevant reach, awareness, qualified traffic, recall, message recognition and brand search.",
        caution:
          "Avoid attention tactics that mislead, sensationalise, stereotype, create fear or make claims the product cannot substantiate."
      },
      interest: {
        label: "Interest",
        prompt:
          "What information will help people understand the problem, benefits, alternatives and relevance to their situation?",
        metric:
          "Engaged visits, content completion, useful questions, repeat visits, event registrations and qualified enquiries.",
        caution:
          "Do not bury material limitations, pricing, eligibility or uncertainty behind vague claims and superficial engagement metrics."
      },
      desire: {
        label: "Desire",
        prompt:
          "What proof, experience or personal relevance helps people move from “this seems useful” to “this may be right for me”?",
        metric:
          "Demo requests, saved configurations, comparison engagement, case-study use, lead quality and stated preference.",
        caution:
          "Use authentic reviews, representative examples and transparent evidence—not fabricated scarcity, social proof or manipulative urgency."
      },
      action: {
        label: "Action",
        prompt:
          "What is the appropriate next step, and how can it be easy, informed, accessible and proportional to the person’s readiness?",
        metric:
          "Completed intended actions, conversion quality, abandonment reasons, accessibility success and consent quality.",
        caution:
          "Avoid dark patterns such as hidden costs, forced account creation, preselected consent, obstructive cancellation or misleading CTAs."
      },
      retention: {
        label: "Retention",
        prompt:
          "How will the relationship continue to create real value after the initial action, while giving customers meaningful choice and control?",
        metric:
          "Repeat use, renewal, satisfaction, support outcomes, referrals, retention by cohort and customer lifetime value.",
        caution:
          "Do not equate lock-in with loyalty; make settings, pauses, cancellation, data export and support straightforward."
      }
    };

    let plans = {
      awareness: {
        task:
          "Research-development staff and project leaders need to recognise that impact planning can be a collaborative, practical process rather than a burdensome administrative exercise.",
        message:
          "Turn complex impact ambitions into a shared, evidence-informed plan that helps teams clarify stakeholders, pathways and next actions.",
        touchpoint:
          "Relevant professional networks, practical webinars, short articles and partner newsletters",
        cta:
          "Read a practical example or register for a short demonstration",
        measure:
          "Measure reach among relevant audiences and webinar sign-ups alongside qualitative feedback on clarity; use consent-based analytics and avoid inflated claims about outcomes."
      },
      interest: {
        task:
          "Potential users need to understand how the workspace fits alongside their existing research-development, funding and project-planning practices.",
        message:
          "The tool structures conversations and evidence without replacing professional judgement, local knowledge or established planning processes.",
        touchpoint:
          "Detailed website pages, explainer videos, webinar walkthroughs, downloadable example outputs and peer discussions",
        cta:
          "Explore a sample workflow or request a guided walkthrough",
        measure:
          "Assess completion of key explanatory content, quality of follow-up questions and interview feedback on relevance; provide accessible formats and clear information about capabilities and limits."
      },
      desire: {
        task:
          "Teams need credible proof that the software will help them produce clearer plans and collaborate more effectively in their own context.",
        message:
          "See how similar teams used a shared workspace to move from broad ambitions to practical actions, assumptions and evidence needs.",
        touchpoint:
          "Consented case studies, live demonstrations, pilot conversations, practitioner testimonials and hands-on trials",
        cta:
          "Discuss a scoped pilot for a real project or planning challenge",
        measure:
          "Track qualified pilot interest and evaluate perceived fit through structured feedback; clearly distinguish prototype examples from independently verified outcomes."
      },
      action: {
        task:
          "A decision-maker needs a simple, transparent route to start a trial, book a demonstration or agree a pilot without avoidable uncertainty.",
        message:
          "Start with a focused pilot: clear scope, named support, transparent data arrangements and a defined review point.",
        touchpoint:
          "Accessible landing page, booking calendar, direct email response and procurement-ready information",
        cta:
          "Book a 30-minute exploration call or request a pilot outline",
        measure:
          "Measure completed, informed enquiries and time to response; explain what happens next, avoid pressured sales tactics and collect only the information needed."
      },
      retention: {
        task:
          "Existing users need ongoing practical value, responsive support and confidence that their work remains accessible, governed and useful over time.",
        message:
          "Keep impact planning live: revisit assumptions, update evidence and retain a clear, shared record as projects develop.",
        touchpoint:
          "Helpful onboarding, periodic value reviews, optional learning sessions, product updates and responsive support",
        cta:
          "Review your workspace, invite relevant collaborators or schedule a value check-in",
        measure:
          "Track voluntary repeat use, support resolution and renewal discussions alongside qualitative evidence of value; make export, permissions and cancellation straightforward."
      }
    };

    let activeStage = "awareness";

    const shortText = (text, length = 96) => {
      const clean = String(text || "").replace(/\s+/g, " ").trim();
      return clean.length > length ? `${clean.slice(0, length - 1)}…` : clean;
    };

    const hasPlan = (stage) => {
      const plan = plans[stage];
      return Boolean(
        plan &&
        [plan.task, plan.message, plan.touchpoint, plan.cta, plan.measure]
          .some((value) => String(value || "").trim())
      );
    };

    const populateForm = (stage) => {
      const plan = plans[stage] || {};

      fields.stage.value = stage;
      fields.task.value = plan.task || "";
      fields.message.value = plan.message || "";
      fields.touchpoint.value = plan.touchpoint || "";
      fields.cta.value = plan.cta || "";
      fields.measure.value = plan.measure || "";
    };

    const selectStage = (stage) => {
      activeStage = stage;
      populateForm(stage);
      renderCanvas();
    };

    const renderCanvas = () => {
      const config = stageConfig[activeStage];
      const plan = plans[activeStage] || {};

      display.detailTitle.textContent = config.label;
      display.detailTask.textContent =
        plan.task || "No audience task has been added for this stage.";
      display.detailMessage.textContent =
        plan.message || "No core message has been added.";
      display.detailTouchpoint.textContent =
        plan.touchpoint || "No touchpoint has been added.";
      display.detailCta.textContent =
        plan.cta || "No next action has been added.";
      display.detailMeasure.textContent =
        plan.measure || "No measure or ethical boundary has been added.";

      Object.keys(stageConfig).forEach((stage) => {
        const button = document.querySelector(`[data-stage="${stage}"]`);
        const summary = document.querySelector(`#${stage}-summary`);
        const status = document.querySelector(`#${stage}-status`);
        const isActive = stage === activeStage;
        const planned = hasPlan(stage);

        button.setAttribute("aria-pressed", String(isActive));
        button.classList.toggle("dimmed", Boolean(activeStage && !isActive));
        summary.textContent = planned
          ? shortText(plans[stage].message || plans[stage].task, 90)
          : "No stage plan added.";
        status.textContent = planned ? "Mapped" : "Not planned";
      });

      const plannedCount = Object.keys(stageConfig).filter(hasPlan).length;
      display.coverageScore.textContent = `${plannedCount}/5`;

      const missing = Object.keys(stageConfig).filter((stage) => !hasPlan(stage));

      display.coverageInsight.innerHTML = missing.length
        ? `<strong>${plannedCount} of 5 stages mapped.</strong> Consider whether you need plans for: ${missing.map((stage) => stageConfig[stage].label).join(", ")}.`
        : "<strong>All five stages are mapped.</strong> Validate the actual journey with research: people may enter, pause, compare and return at different points.";

      display.messageInsight.innerHTML =
        `<strong>${config.label} prompt:</strong> ${config.prompt}`;

      const measurementCount = Object.values(plans).filter(
        (item) => item.measure && item.measure.trim()
      ).length;

      display.measurementInsight.innerHTML = measurementCount === 5
        ? `<strong>All stages include measurement notes.</strong> At this stage, consider: ${config.metric}`
        : `<strong>${measurementCount} of 5 stages include measurement notes.</strong> For ${config.label}, useful signals can include: ${config.metric}`;

      const tips = [
        "Start with audience research: define the decision, context, barriers and trusted information sources before choosing channels or creative.",
        "Make every promise specific and supportable. Use evidence, representative examples and transparent limitations rather than generic superlatives.",
        "Match the CTA to the level of commitment: reading, saving, subscribing, booking, trialling and buying are different asks.",
        "Design for accessibility across copy, contrast, captions, keyboard navigation, forms, language and device conditions.",
        "Treat social proof responsibly: use real, consented testimonials and do not fabricate popularity, countdowns, availability or reviews.",
        "Use the funnel as a diagnostic aid, then check non-linear behaviour through customer interviews, journey data and support feedback."
      ];

      display.guidanceList.innerHTML = "";
      tips.forEach((tip) => {
        const item = document.createElement("li");
        item.innerHTML =
          `<span class="guidance-icon" aria-hidden="true">✓</span><span>${tip}</span>`;
        display.guidanceList.appendChild(item);
      });
    };

    const saveStage = () => {
      const stage = fields.stage.value;

      plans[stage] = {
        task: fields.task.value.trim(),
        message: fields.message.value.trim(),
        touchpoint: fields.touchpoint.value.trim(),
        cta: fields.cta.value.trim(),
        measure: fields.measure.value.trim()
      };

      activeStage = stage;
      renderCanvas();
    };

    const clearStage = () => {
      fields.task.value = "";
      fields.message.value = "";
      fields.touchpoint.value = "";
      fields.cta.value = "";
      fields.measure.value = "";
      fields.task.focus();
    };

    const loadDemo = (demo) => {
      const demos = {
        research: {
          campaign: "Collaborative research-impact planning software",
          plans
        },

        salon: {
          campaign: "Launch of a new local hair and beauty salon",
          plans: {
            awareness: {
              task:
                "Local residents need to know that a new salon is opening and understand its location, credibility, services and opening date.",
              message:
                "A new local salon is opening with experienced stylists, a welcoming environment and a focus on personalised service.",
              touchpoint:
                "Local press, targeted direct mail, community partnerships, search listings and social media",
              cta:
                "Visit the launch page or follow the salon for opening updates",
              measure:
                "Track relevant local reach, branded searches, social follows and opening-page visits; do not make unverified award, availability or discount claims."
            },
            interest: {
              task:
                "Potential customers need enough detail to assess whether the services, stylists, price range and atmosphere match their needs.",
              message:
                "Explore services, stylist experience, transparent booking information and what to expect from a first appointment.",
              touchpoint:
                "Service pages, stylist profiles, short videos, FAQs, reviews and a free consultation offer",
              cta:
                "Browse services or request a complimentary consultation",
              measure:
                "Track service-page engagement, consultation bookings and feedback on clarity; make terms, prices and conditions easy to find."
            },
            desire: {
              task:
                "Interested customers need confidence that the salon will deliver a personally relevant, high-quality experience.",
              message:
                "Meet the team, see consented examples of their work and discover a service designed around your preferences and hair needs.",
              touchpoint:
                "Launch events, stylist consultations, consented portfolios, local creator partnerships and client stories",
              cta:
                "Reserve a launch-event place or discuss your preferred service",
              measure:
                "Measure qualified booking intent and event attendance; use authentic imagery and reviews, avoiding edited claims or pressure-based scarcity."
            },
            action: {
              task:
                "A prospective customer needs an easy, transparent way to book an appointment or redeem a genuinely applicable introductory offer.",
              message:
                "Book online, call or visit the salon—availability, prices, cancellation terms and introductory offer details are clear before confirmation.",
              touchpoint:
                "Online booking page, telephone line, social call buttons, local print advertising and reception desk",
              cta:
                "Book an appointment or call to arrange a consultation",
              measure:
                "Track completed bookings and booking drop-off reasons; use accessible booking forms and avoid hidden fees, misleading countdowns or forced marketing opt-ins."
            },
            retention: {
              task:
                "Customers need a worthwhile reason to return based on consistent service, relevant care advice and manageable account preferences.",
              message:
                "Keep the look you enjoy with optional personalised aftercare, appointment reminders and loyalty benefits that match your preferences.",
              touchpoint:
                "Post-visit follow-up, optional email/SMS reminders, preference-led offers and helpful aftercare content",
              cta:
                "Save your preferred stylist or opt in to a future reminder",
              measure:
                "Track voluntary rebooking, satisfaction and preference changes; make reminder settings and marketing unsubscribe options simple and visible."
            }
          }
        },

        climate: {
          campaign: "Climate and Earth-observation communications service",
          plans: {
            awareness: {
              task:
                "Public-sector and place-based teams need to recognise that technical environmental evidence can be translated into clearer public and stakeholder conversations.",
              message:
                "Make complex climate and Earth-observation evidence understandable, credible and useful for real local decisions.",
              touchpoint:
                "Professional networks, sector events, partner newsletters, articles, podcasts and targeted search content",
              cta:
                "Read an example project or subscribe to practical insights",
              measure:
                "Track reach among relevant roles and qualitative feedback on message clarity; avoid overstating the certainty or local precision of environmental evidence."
            },
            interest: {
              task:
                "Potential clients need to understand the service process, outputs, evidence standards and the kinds of communication challenges it can address.",
              message:
                "From evidence interpretation to stakeholder workshops and accessible outputs, the service helps teams create communication people can use.",
              touchpoint:
                "Detailed service pages, explanatory guides, webinars, sample outputs and discovery conversations",
              cta:
                "Download a practical guide or book a discovery conversation",
              measure:
                "Measure useful engagement and quality of enquiries; clearly explain scope, methods, limitations, data provenance and relevant costs."
            },
            desire: {
              task:
                "Decision-makers need to see how the service could improve a specific programme, engagement process or public-facing decision context.",
              message:
                "See how a tailored evidence and engagement process can make uncertainty clearer, conversations more constructive and decisions more transparent.",
              touchpoint:
                "Consented case studies, presentations, pilot proposals, collaborator introductions and facilitated workshops",
              cta:
                "Discuss a scoped pilot around an upcoming decision or engagement challenge",
              measure:
                "Track qualified discussions and stated problem-solution fit; do not use unconsented community stories or imply causal impact without evidence."
            },
            action: {
              task:
                "A prospective client needs a clear, low-friction way to request a proposal or agree a proportionate pilot.",
              message:
                "Start with a defined, transparent piece of work: agreed purpose, evidence requirements, stakeholder approach, deliverables and review points.",
              touchpoint:
                "Accessible enquiry page, direct email, scheduled call and procurement-ready service information",
              cta:
                "Request a scoped proposal or schedule an initial conversation",
              measure:
                "Measure informed proposal requests and response quality; collect minimal contact data and avoid pressure tactics or misleading availability claims."
            },
            retention: {
              task:
                "Clients need ongoing value, adaptable support and confidence that previous evidence and outputs can be revisited responsibly.",
              message:
                "Build lasting evidence capability through reusable tools, update sessions and collaborative learning—not dependency on one-off reports.",
              touchpoint:
                "Post-project reviews, optional learning sessions, resource updates, partner networks and follow-on planning",
              cta:
                "Review outcomes, identify a next capability need or access updated resources",
              measure:
                "Track repeat work, referrals and reported usefulness alongside client autonomy; make handover, data governance and exit arrangements transparent."
            }
          }
        }
      };

      const selected = demos[demo];
      if (!selected) return;

      fields.campaign.value = selected.campaign;
      plans = JSON.parse(JSON.stringify(selected.plans));
      fields.demoPicker.value = demo;

      selectStage("awareness");
    };

    const copyPlan = async () => {
      const campaign = fields.campaign.value.trim() || "Campaign not specified.";

      const lines = [
        "AIDA MARKETING COMMUNICATIONS PLAN",
        "",
        `Campaign / proposition: ${campaign}`,
        ""
      ];

      Object.entries(stageConfig).forEach(([stage, config]) => {
        const plan = plans[stage] || {};

        lines.push(config.label.toUpperCase());
        lines.push(`Audience need: ${plan.task || "Not added."}`);
        lines.push(`Core message: ${plan.message || "Not added."}`);
        lines.push(`Touchpoint: ${plan.touchpoint || "Not added."}`);
        lines.push(`Next action: ${plan.cta || "Not added."}`);
        lines.push(`Measure / boundary: ${plan.measure || "Not added."}`);
        lines.push("");
      });

      lines.push(
        "Planning note: AIDA is a communication framework, not proof of a linear buyer journey. Validate messages, touchpoints and ethics with real audience research."
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
      saveStage();
    });

    fields.stage.addEventListener("change", () => {
      selectStage(fields.stage.value);
    });

    fields.campaign.addEventListener("input", renderCanvas);

    fields.demoPicker.addEventListener("change", (event) => {
      if (event.target.value) loadDemo(event.target.value);
    });

    document.querySelector("#clear-stage").addEventListener("click", clearStage);
    document.querySelector("#copy-plan").addEventListener("click", copyPlan);

    document.querySelectorAll(".funnel-stage").forEach((button) => {
      button.addEventListener("click", () => {
        selectStage(button.dataset.stage);
      });
    });

    selectStage("awareness");

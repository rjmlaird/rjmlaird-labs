const form = document.querySelector("#mix-form");

    const fields = {
      offerName: document.querySelector("#offer-name"),
      p: document.querySelector("#p-selector"),
      decision: document.querySelector("#p-decision"),
      effect: document.querySelector("#p-effect"),
      evidence: document.querySelector("#p-evidence"),
      demoPicker: document.querySelector("#demo-picker")
    };

    const detail = {
      title: document.querySelector("#detail-title"),
      decision: document.querySelector("#detail-decision"),
      effect: document.querySelector("#detail-effect"),
      evidence: document.querySelector("#detail-evidence"),
      prompt: document.querySelector("#detail-prompt"),
      risk: document.querySelector("#detail-risk")
    };

    const display = {
      offerName: document.querySelector("#offer-name-display"),
      score: document.querySelector("#mix-score"),
      scoreLabel: document.querySelector("#mix-score-label"),
      completeness: document.querySelector("#completeness-insight"),
      trust: document.querySelector("#trust-insight"),
      review: document.querySelector("#review-insight"),
      reviewList: document.querySelector("#review-list")
    };

    const config = {
      product: {
        label: "Product",
        prompt: "What exactly is the offer, which problem does it solve and why is it preferable to alternatives?",
        risk: "Feature-led description without a clear customer benefit or differentiated proposition."
      },
      price: {
        label: "Price",
        prompt: "What is the price, pricing logic, payment model and perceived value exchange for the target customer?",
        risk: "Pricing that ignores willingness to pay, alternatives, cost-to-serve or the value customers perceive."
      },
      place: {
        label: "Place",
        prompt: "Where and how can the target audience discover, access, buy and receive the offer?",
        risk: "Choosing channels that are convenient for the organisation but difficult or unfamiliar for customers."
      },
      promotion: {
        label: "Promotion",
        prompt: "Which messages, channels, content and moments will reach the audience and move them toward action?",
        risk: "High-volume communications that make promises the product, process or people cannot fulfil."
      },
      people: {
        label: "People",
        prompt: "Who shapes the customer experience, and what skills, incentives, capacity and support do they need?",
        risk: "Treating staff, partners and customer support as separate from the marketing promise."
      },
      process: {
        label: "Process",
        prompt: "What journey takes a customer from discovery to purchase, use, support, renewal or referral?",
        risk: "Friction, unclear hand-offs, inconsistent service or inaccessible steps that undermine trust."
      },
      evidence: {
        label: "Physical Evidence",
        prompt: "What tangible cues reassure customers that the offer is credible, high quality and worth choosing?",
        risk: "Relying on polished visuals or unverified claims instead of meaningful proof and transparent information."
      }
    };

    let mix = {
      product: {
        decision:
          "A modular consultancy and interactive-tool offer that turns complex Earth-observation evidence into useful, accessible and decision-ready communication.",
        effect:
          "Potential clients understand the distinct value of combining satellite-data literacy, strategic communications and participatory engagement design.",
        evidence:
          "Qualified enquiries, proposal conversion rate, client feedback, repeat work, project outcomes and attributable referrals."
      },
      price: {
        decision:
          "Use clear modular packages: discovery workshop, strategy sprint, interactive prototype and ongoing communications support, with transparent scope and optional add-ons.",
        effect:
          "Buyers can match investment to their need and understand the value, scope and likely outcome before procurement begins.",
        evidence:
          "Proposal acceptance, average project value, margin, scope-change frequency and buyer feedback on pricing clarity."
      },
      place: {
        decision:
          "Reach clients through a portfolio website, partner referrals, workshops, sector events, research networks and targeted direct outreach.",
        effect:
          "Relevant decision-makers can find the service through trusted routes at the point they are shaping a bid, programme or engagement plan.",
        evidence:
          "Source of qualified leads, website conversion, referral rate, event follow-up and channel-specific conversion."
      },
      promotion: {
        decision:
          "Publish practical tools, concise case studies, visual explainers and thought leadership focused on responsible use of Earth-observation evidence.",
        effect:
          "The right audiences recognise the service as credible, useful and distinct before a buying conversation begins.",
        evidence:
          "Engagement quality, newsletter actions, relevant inbound enquiries, speaking invitations and content-to-enquiry conversion."
      },
      people: {
        decision:
          "Combine research literacy, strategic marketing capability, visual storytelling, facilitation and domain partners where specialist expertise is needed.",
        effect:
          "Clients experience credible advice, clearer collaboration and an approach that respects scientific limits and local knowledge.",
        evidence:
          "Client satisfaction, partner feedback, repeat work, delivery quality reviews and referral patterns."
      },
      process: {
        decision:
          "Use a clear journey: discovery call, needs and stakeholder mapping, scoped proposal, collaborative delivery, feedback, evaluation and follow-up.",
        effect:
          "Customers know what happens next, can contribute meaningfully and experience fewer hand-off or decision delays.",
        evidence:
          "Time to proposal, conversion, delivery milestones, client effort, project completion and post-project feedback."
      },
      evidence: {
        decision:
          "Use a clear portfolio, transparent methodology, accessible project outputs, client testimonials, useful prototypes and documented outcomes.",
        effect:
          "Potential clients have tangible cues of quality, relevance and credibility before they commit.",
        evidence:
          "Portfolio engagement, testimonial quality, proposal win rate, client references and due-diligence feedback."
      }
    };

    let activeP = "product";

    const shortText = (text, length = 74) => {
      const clean = String(text || "").replace(/\s+/g, " ").trim();
      return clean.length > length ? `${clean.slice(0, length - 1)}…` : clean;
    };

    const selectP = (p) => {
      activeP = p;

      const item = mix[p];
      const itemConfig = config[p];

      detail.title.textContent = itemConfig.label;
      detail.decision.textContent =
        item?.decision || "No decision has been added for this marketing-mix element.";
      detail.effect.textContent =
        item?.effect || "No intended customer effect has been added.";
      detail.evidence.textContent =
        item?.evidence || "No measure or evidence source has been added.";
      detail.prompt.textContent = itemConfig.prompt;
      detail.risk.textContent = itemConfig.risk;

      renderMix();
    };

    const renderMix = () => {
      const offerName = fields.offerName.value.trim() || "Your offer";
      display.offerName.textContent = shortText(offerName, 54);

      const planned = Object.entries(mix).filter(
        ([, item]) => item.decision && item.decision.trim()
      ).length;

      display.score.textContent = `${planned}/7`;
      display.scoreLabel.textContent = planned === 7 ? "Elements planned" : "Elements planned";

      Object.keys(config).forEach((p) => {
        const node = document.querySelector(`[data-p="${p}"]`);
        const summary = document.querySelector(`#${p}-summary`);
        const isActive = p === activeP;

        node.setAttribute("aria-pressed", String(isActive));
        node.classList.toggle("dimmed", Boolean(activeP && !isActive));
        summary.textContent = mix[p]?.decision
          ? shortText(mix[p].decision, 62)
          : "No decision added.";
      });

      document.querySelector("#mix-centre").classList.toggle(
        "dimmed",
        Boolean(activeP)
      );

      const missing = Object.keys(config).filter(
        (p) => !mix[p]?.decision || !mix[p].decision.trim()
      );

      display.completeness.innerHTML = missing.length
        ? `<strong>${planned} of 7 elements</strong> are planned. Add: ${missing.map((p) => config[p].label).join(", ")}.`
        : "<strong>All seven elements are planned.</strong> Check that they reinforce one clear value proposition and customer experience.";

      const deliveryPlanned = ["people", "process", "evidence"].filter(
        (p) => mix[p]?.decision && mix[p].decision.trim()
      ).length;

      display.trust.innerHTML =
        deliveryPlanned === 3
          ? "<strong>People, process and physical evidence are all defined.</strong> Review whether your internal delivery reality matches the message you communicate."
          : `<strong>${deliveryPlanned} of 3 trust-and-delivery elements</strong> are defined. Service promises need capable people, clear processes and credible proof.`;

      display.review.innerHTML =
        "<strong>Review before major change.</strong> Revisit the mix when you launch, change a price or channel, receive customer feedback, enter a new segment or redesign the service journey.";

      const prompts = [
        "Is the offer solving a real, specific customer problem—and is the benefit clearer than the feature list?",
        "Does the price communicate value while covering the cost and complexity of delivering a good experience?",
        "Can your priority audience easily find, access, buy and use the offer through the channels you have chosen?",
        "Does promotion describe the same promise that customers encounter in the product, process and people?",
        "What tangible proof reduces risk for someone choosing an unfamiliar or intangible service?",
        "Which assumptions require customer research, usability testing, price testing or campaign measurement rather than internal opinion?"
      ];

      display.reviewList.innerHTML = "";
      prompts.forEach((prompt) => {
        const item = document.createElement("li");
        item.innerHTML =
          `<span class="review-icon" aria-hidden="true">?</span><span>${prompt}</span>`;
        display.reviewList.appendChild(item);
      });
    };

    const populateForm = (p) => {
      const item = mix[p];

      fields.p.value = p;
      fields.decision.value = item?.decision || "";
      fields.effect.value = item?.effect || "";
      fields.evidence.value = item?.evidence || "";
    };

    const saveEntry = () => {
      const p = fields.p.value;

      mix[p] = {
        decision: fields.decision.value.trim(),
        effect: fields.effect.value.trim(),
        evidence: fields.evidence.value.trim()
      };

      selectP(p);
    };

    const clearEntry = () => {
      fields.decision.value = "";
      fields.effect.value = "";
      fields.evidence.value = "";
      fields.decision.focus();
    };

    const loadDemo = (demo) => {
      const demos = {
        "eo-service": {
          offerName: "Earth-observation storytelling and engagement services",
          mix
        },
        "software-tool": {
          offerName: "Collaborative research-impact mapping software",
          mix: {
            product: {
              decision:
                "A browser-based collaborative workspace for researchers and programme teams to map stakeholders, pathways, evidence and decisions.",
              effect:
                "Users can turn fragmented planning notes into a shareable, editable map that supports funding bids, programme design and impact conversations.",
              evidence:
                "Trial sign-ups, activation rate, workspace completion, return use, team invitations, renewal and customer interviews."
            },
            price: {
              decision:
                "Offer a free guided prototype, individual subscription, team plan and institution-level licence with clear limits and transparent annual pricing.",
              effect:
                "Small teams can test usefulness at low risk while organisations can scale access when collaboration and governance matter.",
              evidence:
                "Free-to-paid conversion, average revenue per account, churn, discount reliance, sales-cycle length and renewal rate."
            },
            place: {
              decision:
                "Distribute directly through a product website, app onboarding, university partnerships, research-development networks and online demonstrations.",
              effect:
                "Researchers and professional-services teams can discover and evaluate the product where they already seek research-impact support.",
              evidence:
                "Organic search, partner referrals, demo attendance, app-store or web conversion and institutional inbound leads."
            },
            promotion: {
              decision:
                "Use useful templates, short product demos, practitioner webinars, newsletter content and case studies that show how teams solve real planning problems.",
              effect:
                "Potential users see a practical solution rather than abstract software features and have a reason to try the tool.",
              evidence:
                "Content-assisted trials, webinar-to-trial conversion, qualified lead rate, email engagement and demo bookings."
            },
            people: {
              decision:
                "Provide responsive onboarding, product education, accessibility-aware support and a specialist advisory network for complex research-impact use cases.",
              effect:
                "Users feel supported enough to move from initial exploration to confident adoption across a team.",
              evidence:
                "Support response time, onboarding completion, user satisfaction, time-to-value and referrals."
            },
            process: {
              decision:
                "Design a low-friction journey: landing page, guided template, workspace creation, collaboration invite, export, feedback prompt and helpful follow-up.",
              effect:
                "Users can reach a useful first output quickly without confusing configuration or unnecessary hand-offs.",
              evidence:
                "Activation funnel, completion time, drop-off points, task success rate, support tickets and retention."
            },
            evidence: {
              decision:
                "Show accessible product screenshots, live demos, transparent pricing, security information, user testimonials, templates and case studies.",
              effect:
                "Prospective users have tangible reassurance that the product is credible, usable and suitable for their context.",
              evidence:
                "Demo-to-trial conversion, sales objections, trust-page use, security-review outcomes and testimonial influence."
            }
          }
        },
        "training-course": {
          offerName: "Practical climate communication and engagement training course",
          mix: {
            product: {
              decision:
                "A live and online training course combining climate literacy, message design, stakeholder mapping, responsible claims and practical toolkits.",
              effect:
                "Participants gain confidence and reusable methods for communicating complex climate evidence with varied audiences.",
              evidence:
                "Course completion, self-reported confidence, applied exercises, follow-up interviews and employer feedback."
            },
            price: {
              decision:
                "Set an individual fee with early-bird, group-booking and sponsored-place options, supported by transparent learning outcomes and time commitment.",
              effect:
                "The course feels accessible while signalling professional value and supporting a viable delivery model.",
              evidence:
                "Enrolment rate, price objections, group bookings, scholarship uptake, revenue per cohort and completion."
            },
            place: {
              decision:
                "Offer virtual cohorts, occasional regional in-person workshops and tailored in-house delivery for organisations.",
              effect:
                "Participants can choose a format that fits their location, schedule, accessibility needs and organisational context.",
              evidence:
                "Format preference, attendance, regional demand, travel barriers and cohort satisfaction."
            },
            promotion: {
              decision:
                "Use sample tools, alumni stories, sector partnerships, newsletters, LinkedIn content and webinars focused on common communication challenges.",
              effect:
                "Potential participants can judge relevance and see how the training relates to real professional problems.",
              evidence:
                "Source of enrolment, webinar conversion, content engagement, partner referrals and waitlist growth."
            },
            people: {
              decision:
                "Use facilitators with communication, research and climate expertise, plus accessible learner support and guest practitioner contributions.",
              effect:
                "Participants receive credible, practical guidance and feel able to test ideas in a constructive learning environment.",
              evidence:
                "Facilitator ratings, participant feedback, support requests, repeat bookings and referrals."
            },
            process: {
              decision:
                "Provide clear enrolment, pre-course briefing, interactive sessions, practical exercises, resource access, feedback and a post-course action prompt.",
              effect:
                "Learners know what to expect and can turn learning into action rather than leaving with only general inspiration.",
              evidence:
                "Attendance, exercise completion, learning evaluation, resource use and follow-up action reports."
            },
            evidence: {
              decision:
                "Provide clear course outlines, facilitator biographies, accredited or recognised partners where appropriate, testimonials and sample materials.",
              effect:
                "Prospective learners can see concrete signs of quality and relevance before committing time and budget.",
              evidence:
                "Landing-page conversion, feedback on decision factors, testimonial engagement and enquiry-to-enrolment conversion."
            }
          }
        }
      };

      const selected = demos[demo];
      if (!selected) return;

      fields.offerName.value = selected.offerName;
      mix = JSON.parse(JSON.stringify(selected.mix));
      fields.demoPicker.value = demo;

      populateForm("product");
      selectP("product");
    };

    const copyMix = async () => {
      const offer = fields.offerName.value.trim() || "Offer not specified.";

      const lines = [
        "7Ps MARKETING MIX",
        "",
        `Offer: ${offer}`,
        ""
      ];

      Object.keys(config).forEach((p) => {
        const item = mix[p];

        lines.push(config[p].label.toUpperCase());
        lines.push(`Decision: ${item?.decision || "Not added."}`);
        lines.push(`Intended customer effect: ${item?.effect || "Not added."}`);
        lines.push(`Evidence / measure: ${item?.evidence || "Not added."}`);
        lines.push("");
      });

      lines.push(
        "Planning note: Validate this mix through customer research, testing and measurement. Review it as the market, offer and delivery experience evolve."
      );

      const button = document.querySelector("#copy-mix");
      const originalLabel = button.textContent;

      try {
        await navigator.clipboard.writeText(lines.join("\n"));
        button.textContent = "Mix copied";
      } catch {
        button.textContent = "Copy unavailable";
      }

      window.setTimeout(() => {
        button.textContent = originalLabel;
      }, 1800);
    };

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      saveEntry();
    });

    fields.p.addEventListener("change", () => {
      populateForm(fields.p.value);
    });

    fields.offerName.addEventListener("input", renderMix);

    fields.demoPicker.addEventListener("change", (event) => {
      if (event.target.value) loadDemo(event.target.value);
    });

    document.querySelector("#clear-p").addEventListener("click", clearEntry);
    document.querySelector("#copy-mix").addEventListener("click", copyMix);

    document.querySelectorAll(".mix-node").forEach((node) => {
      node.addEventListener("click", () => {
        const p = node.dataset.p;
        populateForm(p);
        selectP(p);
      });
    });

    populateForm("product");
    selectP("product");

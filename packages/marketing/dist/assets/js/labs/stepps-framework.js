const form = document.querySelector("#stepps-form");

    const fields = {
      campaign: document.querySelector("#campaign-name"),
      step: document.querySelector("#step-selector"),
      idea: document.querySelector("#step-idea"),
      benefit: document.querySelector("#step-benefit"),
      evidence: document.querySelector("#step-evidence"),
      demoPicker: document.querySelector("#demo-picker")
    };

    const display = {
      coverageScore: document.querySelector("#coverage-score"),
      coverageLabel: document.querySelector("#coverage-label"),
      detailTitle: document.querySelector("#detail-title"),
      detailIdea: document.querySelector("#detail-idea"),
      detailBenefit: document.querySelector("#detail-benefit"),
      detailEvidence: document.querySelector("#detail-evidence"),
      detailPrompt: document.querySelector("#detail-prompt"),
      detailRisk: document.querySelector("#detail-risk"),
      coverageInsight: document.querySelector("#coverage-insight"),
      valueInsight: document.querySelector("#value-insight"),
      testingInsight: document.querySelector("#testing-insight"),
      ethicsList: document.querySelector("#ethics-list")
    };

    const config = {
      currency: {
        label: "Social Currency",
        prompt:
          "What would make sharing this feel useful, interesting, identity-affirming or appropriately insider-informed for the audience?",
        risk:
          "Exclusivity or status signalling that humiliates, excludes or pressures people to share in order to belong."
      },
      triggers: {
        label: "Triggers",
        prompt:
          "What frequent, relevant and ethical everyday cue could remind people of the idea when they can genuinely act on it?",
        risk:
          "Forcing irrelevant associations, exploiting sensitive contexts or creating intrusive reminders that people cannot control."
      },
      emotion: {
        label: "Emotion",
        prompt:
          "Which meaningful feeling supports understanding and action without exaggeration, manipulation or distress?",
        risk:
          "Using fear, anger, grief or outrage to generate attention while distorting risk, context or evidence."
      },
      public: {
        label: "Public",
        prompt:
          "How can the action, use or outcome become visible and easy to imitate without exposing people or pressuring participation?",
        risk:
          "Making personal behaviour public by default, rewarding performative sharing or turning private experiences into marketing assets without consent."
      },
      value: {
        label: "Practical Value",
        prompt:
          "What concrete, accurate and usable help will people gain—and can they apply it in their own situation?",
        risk:
          "Presenting oversimplified, unsafe, untested or context-free advice as universally applicable."
      },
      stories: {
        label: "Stories",
        prompt:
          "What narrative carries the central idea so that people can retell it accurately without losing the key message?",
        risk:
          "Emotional storytelling that erases context, appropriates lived experience or makes claims that the evidence cannot support."
      }
    };

    let plan = {
      currency: {
        idea:
          "Give local climate practitioners a concise, shareable “evidence translator” card that turns one satellite-data insight into a clear question they can use in a meeting or community conversation.",
        benefit:
          "It helps practitioners explain a complex topic confidently, look prepared and bring a grounded evidence point into decision-making conversations.",
        evidence:
          "Test comprehension and real-world use in workshops; clearly state data limits, source information and uncertainty rather than overstating what a map or metric can prove."
      },
      triggers: {
        idea:
          "Tie monthly content to regular planning moments—such as local resilience meetings, seasonal weather patterns and public consultation cycles—rather than creating artificial urgency.",
        benefit:
          "The resource appears when the information is most relevant to a real conversation or decision, making it easier to remember and use.",
        evidence:
          "Track uptake around relevant dates and ask users whether the timing was useful; avoid automated prompts that are irrelevant, excessive or difficult to disable."
      },
      emotion: {
        idea:
          "Use grounded stories of local people and organisations making practical climate decisions, balancing honest concern with agency, care and achievable next steps.",
        benefit:
          "Audiences can connect with the human significance of environmental evidence without being overwhelmed, blamed or misled.",
        evidence:
          "Test emotional response and understanding with participants; obtain informed consent, avoid trauma framing and keep factual claims proportionate to the evidence."
      },
      public: {
        idea:
          "Create accessible, attribution-friendly visual cards and workshop outputs that participants can choose to share, adapt or display in their own networks.",
        benefit:
          "Useful materials are easy to recognise and pass along while allowing communities to retain context, voice and control over how they participate.",
        evidence:
          "Provide accessible formats, alt text and clear usage guidance; never publish participant identities, locations or contributions without explicit permission."
      },
      value: {
        idea:
          "Publish short practical guides on interpreting Earth-observation evidence, asking better questions of data and communicating uncertainty in public-facing work.",
        benefit:
          "People gain reusable, accurate tools that improve decisions and conversations beyond the immediate campaign.",
        evidence:
          "Test whether users can apply the guidance correctly in realistic scenarios; cite sources, explain limits and update material when evidence changes."
      },
      stories: {
        idea:
          "Follow one local decision journey from an initial question through evidence gathering, stakeholder discussion and a transparent action or trade-off.",
        benefit:
          "The audience can understand how data fits into a real-world process, rather than seeing isolated maps, claims or technical terms.",
        evidence:
          "Co-create and fact-check the story with relevant contributors; ensure the evidence, uncertainty and community perspective remain integral to the narrative."
      }
    };

    let activeStep = "currency";

    const shortText = (text, length = 90) => {
      const clean = String(text || "").replace(/\s+/g, " ").trim();
      return clean.length > length ? `${clean.slice(0, length - 1)}…` : clean;
    };

    const selectStep = (step) => {
      activeStep = step;

      const item = plan[step];
      const info = config[step];

      display.detailTitle.textContent = info.label;
      display.detailIdea.textContent =
        item?.idea || "No creative or content choice has been added for this element.";
      display.detailBenefit.textContent =
        item?.benefit || "No audience benefit has been added.";
      display.detailEvidence.textContent =
        item?.evidence || "No test, evidence source or ethical boundary has been added.";
      display.detailPrompt.textContent = info.prompt;
      display.detailRisk.textContent = info.risk;

      renderCanvas();
    };

    const renderCanvas = () => {
      const mapped = Object.entries(plan).filter(
        ([, item]) => item.idea && item.idea.trim()
      ).length;

      display.coverageScore.textContent = `${mapped}/6`;
      display.coverageLabel.textContent = "Elements mapped";

      Object.keys(config).forEach((step) => {
        const card = document.querySelector(`[data-step="${step}"]`);
        const summary = document.querySelector(`#${step}-summary`);
        const status = document.querySelector(`#${step}-status`);
        const isActive = step === activeStep;
        const planned = plan[step]?.idea && plan[step].idea.trim();

        card.setAttribute("aria-pressed", String(isActive));
        card.classList.toggle("dimmed", Boolean(activeStep && !isActive));

        summary.textContent = planned
          ? shortText(plan[step].idea, 77)
          : "No idea added.";

        status.textContent = planned ? "Mapped" : "Not planned";
      });

      const missing = Object.keys(config).filter(
        (step) => !plan[step]?.idea || !plan[step].idea.trim()
      );

      display.coverageInsight.innerHTML = missing.length
        ? `<strong>${mapped} of 6 elements mapped.</strong> Consider: ${missing.map((step) => config[step].label).join(", ")}. Use only elements that genuinely support the idea.`
        : "<strong>All six elements are mapped.</strong> Prioritise clarity and usefulness over trying to force every mechanism into every content item.";

      const evidenceCount = Object.values(plan).filter(
        (item) => item.evidence && item.evidence.trim()
      ).length;

      display.valueInsight.innerHTML =
        "<strong>Ask before publishing:</strong> does this help the intended audience understand, decide, connect or act in a way they would consider worthwhile?";

      display.testingInsight.innerHTML = evidenceCount === 6
        ? "<strong>Every element has an evidence or ethics note.</strong> Test comprehension, trust, accessibility, relevance and practical use with representative audiences."
        : `<strong>${evidenceCount} of 6 elements include evidence or a boundary.</strong> Add a test and safety constraint before optimising for reach.`;

      const checks = [
        "Is the core claim accurate, sourced where appropriate and clear about uncertainty, limitations and relevance?",
        "Would a reasonable audience member understand why they are seeing the content and whether it includes a commercial or sponsored message?",
        "Does the content give people a real choice to share, participate, subscribe or disengage without pressure or penalty?",
        "Are stories developed with consent, fair representation and context—particularly when they involve communities, vulnerable people or lived experience?",
        "Is the content accessible across language, reading level, captions, transcripts, colour contrast, image description and format choices where relevant?",
        "Will success be assessed through meaningful outcomes—such as comprehension, useful action, trust or community benefit—not only reach and engagement?"
      ];

      display.ethicsList.innerHTML = "";

      checks.forEach((check) => {
        const item = document.createElement("li");
        item.innerHTML =
          `<span class="ethics-icon" aria-hidden="true">✓</span><span>${check}</span>`;
        display.ethicsList.appendChild(item);
      });
    };

    const populateForm = (step) => {
      const item = plan[step] || {};

      fields.step.value = step;
      fields.idea.value = item.idea || "";
      fields.benefit.value = item.benefit || "";
      fields.evidence.value = item.evidence || "";
    };

    const saveStep = () => {
      const step = fields.step.value;

      plan[step] = {
        idea: fields.idea.value.trim(),
        benefit: fields.benefit.value.trim(),
        evidence: fields.evidence.value.trim()
      };

      selectStep(step);
    };

    const clearStep = () => {
      fields.idea.value = "";
      fields.benefit.value = "";
      fields.evidence.value = "";
      fields.idea.focus();
    };

    const loadDemo = (demo) => {
      const demos = {
        climate: {
          campaign:
            "A public campaign showing how satellite data supports local climate action",
          plan
        },

        "product-launch": {
          campaign:
            "Launch campaign for a refillable, lower-waste home essentials range",
          plan: {
            currency: {
              idea:
                "Offer early supporters a useful “low-waste home swap” guide with practical, shareable choices rather than status-only exclusivity.",
              benefit:
                "People can feel informed and helpful when sharing realistic ways to reduce household waste with friends, colleagues or family.",
              evidence:
                "Test whether the guide is useful across budgets and living situations; avoid shaming people for constraints, consumption choices or access to refill options."
            },
            triggers: {
              idea:
                "Connect content to recurring household moments such as shopping lists, moving home, seasonal cleaning and weekly meal planning.",
              benefit:
                "The campaign appears when people are already considering relevant choices, making the advice easier to remember and apply.",
              evidence:
                "Test message timing and relevance; do not send excessive reminders or imply that every lifestyle change is easy or equally accessible."
            },
            emotion: {
              idea:
                "Use hopeful, specific stories about people reducing waste through manageable changes, showing trade-offs honestly rather than promising perfection.",
              benefit:
                "Audiences can feel capable and supported rather than guilty, overwhelmed or judged.",
              evidence:
                "Conduct user testing for emotional impact and comprehension; avoid eco-anxiety manipulation, exaggerated claims and imagery that stereotypes households."
            },
            public: {
              idea:
                "Create clear, recognisable refill packaging and optional shareable progress cards that people can use only if they wish.",
              benefit:
                "Sustainable choices become visible and easier to ask about without making public sharing a condition of participation.",
              evidence:
                "Ensure packaging claims are substantiated and accessible; never use customer posts or images in marketing without permission."
            },
            value: {
              idea:
                "Publish transparent cost-per-use comparisons, storage tips and refill-location guidance that help people decide whether the products fit their routine.",
              benefit:
                "Customers receive practical, decision-useful information instead of vague sustainability messaging.",
              evidence:
                "Validate calculations, update location information and explain assumptions; avoid implying universal savings where circumstances differ."
            },
            stories: {
              idea:
                "Tell the story of a household identifying one recurring waste problem, trying a refill option and deciding what worked, what did not and why.",
              benefit:
                "People can see a realistic decision process and adapt lessons to their own context.",
              evidence:
                "Use real, consented experiences and include practical context; do not script testimonials or hide material limitations."
            }
          }
        },

        learning: {
          campaign:
            "A practical public resource for improving evidence communication skills",
          plan: {
            currency: {
              idea:
                "Create concise “explain it clearly” templates that help professionals share a useful communication technique with peers.",
              benefit:
                "Users can feel capable and generous by passing on a practical tool that helps others communicate more responsibly.",
              evidence:
                "Test whether users understand and can apply the technique; avoid framing basic knowledge as exclusive expertise."
            },
            triggers: {
              idea:
                "Anchor resources to common work moments: preparing slides, writing a briefing, responding to a question or planning a stakeholder meeting.",
              benefit:
                "The guidance is recalled when it can improve a real piece of work rather than appearing as abstract advice.",
              evidence:
                "Ask users when and how they used the resource; avoid intrusive prompts and ensure reminders are opt-in."
            },
            emotion: {
              idea:
                "Use short before-and-after examples that create recognition, relief and confidence when a confusing explanation becomes clearer.",
              benefit:
                "People feel that better communication is attainable and that they can improve without embarrassment.",
              evidence:
                "Check that examples do not mock individuals or oversimplify complex topics; test whether confidence is matched by actual understanding."
            },
            public: {
              idea:
                "Provide accessible templates and optional badges for organisations that complete a transparent, evidence-communication review.",
              benefit:
                "Good practice becomes more visible and easier to recognise without turning participation into a public ranking system.",
              evidence:
                "Make criteria transparent, allow organisations to opt out and avoid badges that overstate quality or imply endorsement without evidence."
            },
            value: {
              idea:
                "Publish checklists, plain-language editing tips and methods for communicating uncertainty accurately in time-pressured work.",
              benefit:
                "Users gain immediately applicable tools that can improve a briefing, presentation, report or public post.",
              evidence:
                "Test tool usefulness and accessibility with target users; cite sources and make clear when judgement or specialist review is still needed."
            },
            stories: {
              idea:
                "Tell a case story of a team revising a confusing public message after listening to its audience and checking evidence assumptions.",
              benefit:
                "The narrative shows that clear, responsible communication is an iterative practice rather than a one-off performance.",
              evidence:
                "Fact-check the case, use consented details and retain the complexity that made the change necessary."
            }
          }
        }
      };

      const selected = demos[demo];
      if (!selected) return;

      fields.campaign.value = selected.campaign;
      plan = JSON.parse(JSON.stringify(selected.plan));
      fields.demoPicker.value = demo;

      populateForm("currency");
      selectStep("currency");
    };

    const copyCanvas = async () => {
      const campaign = fields.campaign.value.trim() || "Campaign not specified.";

      const lines = [
        "STEPPS CONTENT CANVAS",
        "",
        `Campaign / idea: ${campaign}`,
        ""
      ];

      Object.entries(config).forEach(([step, info]) => {
        const item = plan[step] || {};

        lines.push(info.label.toUpperCase());
        lines.push(`Creative choice: ${item.idea || "Not added."}`);
        lines.push(`Audience benefit: ${item.benefit || "Not added."}`);
        lines.push(`Evidence / ethical boundary: ${item.evidence || "Not added."}`);
        lines.push(`Ethical risk to avoid: ${info.risk}`);
        lines.push("");
      });

      lines.push(
        "Planning note: Use STEPPS to design voluntary sharing around accuracy, usefulness, accessibility and audience benefit—not manipulation or vanity metrics."
      );

      const button = document.querySelector("#copy-canvas");
      const originalLabel = button.textContent;

      try {
        await navigator.clipboard.writeText(lines.join("\n"));
        button.textContent = "Canvas copied";
      } catch {
        button.textContent = "Copy unavailable";
      }

      window.setTimeout(() => {
        button.textContent = originalLabel;
      }, 1800);
    };

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      saveStep();
    });

    fields.step.addEventListener("change", () => {
      populateForm(fields.step.value);
      selectStep(fields.step.value);
    });

    fields.campaign.addEventListener("input", renderCanvas);

    fields.demoPicker.addEventListener("change", (event) => {
      if (event.target.value) loadDemo(event.target.value);
    });

    document.querySelector("#clear-step").addEventListener("click", clearStep);
    document.querySelector("#copy-canvas").addEventListener("click", copyCanvas);

    document.querySelectorAll(".step-card").forEach((card) => {
      card.addEventListener("click", () => {
        const step = card.dataset.step;
        populateForm(step);
        selectStep(step);
      });
    });

    populateForm("currency");
    selectStep("currency");

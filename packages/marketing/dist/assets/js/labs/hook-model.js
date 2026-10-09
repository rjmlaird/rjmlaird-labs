const form = document.querySelector("#hook-form");

    const fields = {
      product: document.querySelector("#product-name"),
      step: document.querySelector("#step-selector"),
      design: document.querySelector("#step-design"),
      value: document.querySelector("#step-value"),
      evidence: document.querySelector("#step-evidence"),
      demoPicker: document.querySelector("#demo-picker")
    };

    const display = {
      productName: document.querySelector("#product-name-display"),
      ethicsStatus: document.querySelector("#ethics-status"),
      detailTitle: document.querySelector("#detail-title"),
      detailDesign: document.querySelector("#detail-design"),
      detailValue: document.querySelector("#detail-value"),
      detailEvidence: document.querySelector("#detail-evidence"),
      detailPrompt: document.querySelector("#detail-prompt"),
      detailRisk: document.querySelector("#detail-risk"),
      completeness: document.querySelector("#completeness-insight"),
      valueInsight: document.querySelector("#value-insight"),
      controlInsight: document.querySelector("#control-insight"),
      ethicsList: document.querySelector("#ethics-list")
    };

    const stepConfig = {
      trigger: {
        label: "Trigger",
        prompt:
          "What context, need or clearly chosen cue prompts the user to seek this value?",
        risk:
          "Excessive, poorly timed or guilt-inducing prompts; notifications users did not meaningfully choose."
      },
      action: {
        label: "Action",
        prompt:
          "What is the simplest useful behaviour a user can take in anticipation of a meaningful outcome?",
        risk:
          "Friction reduction that removes informed choice, obscures consequences or makes unwanted actions too easy."
      },
      reward: {
        label: "Variable Reward",
        prompt:
          "What valuable outcome can vary naturally without manufacturing anxiety, scarcity or endless checking?",
        risk:
          "Using unpredictable rewards, social comparison, streak pressure or artificial scarcity to drive compulsive use."
      },
      investment: {
        label: "Investment",
        prompt:
          "What voluntary contribution makes the product more useful to the person next time?",
        risk:
          "Creating lock-in through unnecessary data capture, hidden switching costs or making export and deletion difficult."
      }
    };

    let loop = {
      trigger: {
        design:
          "A user-controlled daily reminder appears at the time they have chosen, inviting them to log a workout or select an intentional rest day.",
        value:
          "It helps users build a consistent, self-directed movement routine without making them feel punished for missed days.",
        evidence:
          "Track opt-in reminder retention and voluntary workout logging; allow easy frequency controls, quiet hours and a one-tap pause or unsubscribe option."
      },
      action: {
        design:
          "The home screen offers two clear choices: log a completed activity in a few taps or choose a short, adaptable movement suggestion.",
        value:
          "Users can act on their intention quickly, including on low-energy days, without a complicated form or a long search.",
        evidence:
          "Test task completion, time-to-log and accessibility with diverse users; avoid defaults that publish, share or start a paid flow unexpectedly."
      },
      reward: {
        design:
          "The app shows a changing, evidence-informed reflection on progress, recovery and personal goals instead of randomised prizes or social-pressure rankings.",
        value:
          "Users receive useful feedback that helps them notice sustainable patterns and choose an appropriate next step.",
        evidence:
          "Measure perceived usefulness and wellbeing in user research; avoid gambling-like mechanics, artificial scarcity and punitive streak-loss messages."
      },
      investment: {
        design:
          "Users can optionally save preferences, milestones and personal notes to make future suggestions more relevant and their progress easier to understand.",
        value:
          "The experience becomes more personally useful over time while users retain ownership and control over their information.",
        evidence:
          "Provide clear privacy choices, export and deletion tools, and an explanation of how saved data improves future recommendations."
      }
    };

    let activeStep = "trigger";

    const shortText = (text, length = 84) => {
      const clean = String(text || "").replace(/\s+/g, " ").trim();
      return clean.length > length ? `${clean.slice(0, length - 1)}…` : clean;
    };

    const selectStep = (step) => {
      activeStep = step;

      const item = loop[step];
      const config = stepConfig[step];

      display.detailTitle.textContent = config.label;
      display.detailDesign.textContent =
        item?.design || "No design decision has been added for this stage.";
      display.detailValue.textContent =
        item?.value || "No user benefit has been added.";
      display.detailEvidence.textContent =
        item?.evidence || "No evidence or ethical guardrail has been added.";
      display.detailPrompt.textContent = config.prompt;
      display.detailRisk.textContent = config.risk;

      renderLoop();
    };

    const renderLoop = () => {
      display.productName.textContent =
        shortText(fields.product.value.trim() || "Your product", 54);

      const completed = Object.entries(loop).filter(
        ([, item]) => item.design && item.design.trim()
      ).length;

      Object.keys(stepConfig).forEach((step) => {
        const node = document.querySelector(`[data-step="${step}"]`);
        const summary = document.querySelector(`#${step}-summary`);
        const isActive = step === activeStep;

        node.setAttribute("aria-pressed", String(isActive));
        node.classList.toggle("dimmed", Boolean(activeStep && !isActive));

        summary.textContent = loop[step]?.design
          ? shortText(loop[step].design, 67)
          : "No design added.";
      });

      document.querySelector("#hook-centre").classList.toggle(
        "dimmed",
        Boolean(activeStep)
      );

      const missing = Object.keys(stepConfig).filter(
        (step) => !loop[step]?.design || !loop[step].design.trim()
      );

      display.completeness.innerHTML = missing.length
        ? `<strong>${completed} of 4 stages mapped.</strong> Add: ${missing.map((step) => stepConfig[step].label).join(", ")}.`
        : "<strong>All four stages are mapped.</strong> Check that every stage delivers a legitimate user benefit and does not depend on harmful pressure.";

      const evidenceCount = Object.values(loop).filter(
        (item) => item.evidence && item.evidence.trim()
      ).length;

      display.valueInsight.innerHTML =
        "<strong>Ask a value question:</strong> would a well-informed user say this loop helps them accomplish something they genuinely want, in a way they would choose again?";

      display.controlInsight.innerHTML = evidenceCount === 4
        ? "<strong>All stages include evidence or guardrails.</strong> Validate these safeguards through accessibility review, user research and product analytics—not assumptions."
        : `<strong>${evidenceCount} of 4 stages include a guardrail.</strong> Add controls for consent, privacy, notifications, pauses, export and easy exit.`;

      display.ethicsStatus.textContent =
        completed === 4 && evidenceCount === 4 ? "Guardrails mapped" : "Review needed";

      const checks = [
        "Does the product solve a real, user-defined problem rather than create anxiety or dependence to generate engagement?",
        "Can people control prompts, reminders, personalisation, notifications and recommendations without penalty?",
        "Is the desired action understandable, reversible where possible and free from deceptive defaults or hidden costs?",
        "Does the reward provide genuine value without gambling-like uncertainty, fear of missing out or harmful social comparison?",
        "Is every investment voluntary, proportionate and transparent—and can users export or delete their data easily?",
        "Would you be comfortable explaining the loop, its data use and its likely effects to users, regulators and an independent ethics reviewer?"
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
      const item = loop[step] || {};

      fields.step.value = step;
      fields.design.value = item.design || "";
      fields.value.value = item.value || "";
      fields.evidence.value = item.evidence || "";
    };

    const saveStep = () => {
      const step = fields.step.value;

      loop[step] = {
        design: fields.design.value.trim(),
        value: fields.value.value.trim(),
        evidence: fields.evidence.value.trim()
      };

      selectStep(step);
    };

    const clearStep = () => {
      fields.design.value = "";
      fields.value.value = "";
      fields.evidence.value = "";
      fields.design.focus();
    };

    const loadDemo = (demo) => {
      const demos = {
        fitness: {
          product: "A fitness and wellbeing habit-tracking app",
          loop
        },

        learning: {
          product: "A professional learning and skills-development app",
          loop: {
            trigger: {
              design:
                "Users choose a weekly learning intention and optional reminder window linked to a goal they have set, such as preparing for a role or completing a work task.",
              value:
                "The prompt helps users make time for learning they already consider important without interrupting them at inappropriate times.",
              evidence:
                "Track reminder opt-in, pause and adjustment behaviour; provide quiet hours, simple schedule editing and no penalty for turning reminders off."
            },
            action: {
              design:
                "The app opens directly to one small, clearly labelled learning activity that can be completed or saved for later in a few minutes.",
              value:
                "People can make useful progress even when time and attention are limited.",
              evidence:
                "Test completion, comprehension and accessibility; make it easy to stop, resume or choose a different activity without losing progress."
            },
            reward: {
              design:
                "Users receive relevant feedback, a visible record of skills practised and occasional optional recommendations based on their stated goals.",
              value:
                "They can see real progress and choose useful next steps instead of chasing arbitrary points or rankings.",
              evidence:
                "Measure learning confidence and outcome relevance through research; avoid streak pressure, misleading certificates and endless content feeds."
            },
            investment: {
              design:
                "Users may save notes, goals, completed practice and preferred topics, making future learning suggestions more relevant and their portfolio more useful.",
              value:
                "Their work becomes easier to revisit, reflect on and share when they choose.",
              evidence:
                "Explain data use clearly and offer download, deletion and privacy controls; never use saved learning data for unrelated targeting without consent."
            }
          }
        },

        "research-tool": {
          product: "Collaborative research-impact planning workspace",
          loop: {
            trigger: {
              design:
                "A user sets optional milestones before a funding deadline, stakeholder workshop or project-planning meeting and receives only the reminders they select.",
              value:
                "The product helps teams return to an important planning task at a useful moment without creating false urgency.",
              evidence:
                "Track reminder opt-in and completion of intended planning tasks; enable straightforward schedules, quiet hours and disable options."
            },
            action: {
              design:
                "A returning user can open their most recent workspace and complete one suggested next planning step, such as adding a stakeholder or reviewing an assumption.",
              value:
                "They can resume complex collaborative work without having to reconstruct context or navigate a large dashboard.",
              evidence:
                "Test time-to-resume, task success and perceived clarity with real project teams; avoid automatic sharing or irreversible edits."
            },
            reward: {
              design:
                "The workspace reveals useful connections, gaps and next questions as the team adds evidence, stakeholders and intended outcomes.",
              value:
                "Users gain a clearer, more actionable view of their project rather than an addictive feed or superficial badge system.",
              evidence:
                "Assess whether findings improve planning quality in workshops and interviews; make uncertainty visible rather than overstating automated recommendations."
            },
            investment: {
              design:
                "Teams voluntarily add project context, stakeholder notes, evidence and decisions that make the workspace more useful for future meetings and reporting.",
              value:
                "Their shared planning record becomes easier to update, explain and reuse over the lifetime of the project.",
              evidence:
                "Provide role-based permissions, clear consent, export, deletion and transparent governance for all stored project information."
            }
          }
        }
      };

      const selected = demos[demo];
      if (!selected) return;

      fields.product.value = selected.product;
      loop = JSON.parse(JSON.stringify(selected.loop));
      fields.demoPicker.value = demo;

      populateForm("trigger");
      selectStep("trigger");
    };

    const copyHook = async () => {
      const product = fields.product.value.trim() || "Product not specified.";

      const lines = [
        "ETHICAL HOOK MODEL CANVAS",
        "",
        `Product: ${product}`,
        ""
      ];

      Object.entries(stepConfig).forEach(([step, config]) => {
        const item = loop[step] || {};

        lines.push(config.label.toUpperCase());
        lines.push(`Design decision: ${item.design || "Not added."}`);
        lines.push(`User benefit: ${item.value || "Not added."}`);
        lines.push(`Evidence / guardrail: ${item.evidence || "Not added."}`);
        lines.push(`Ethical question: ${config.risk}`);
        lines.push("");
      });

      lines.push(
        "Ethical design note: Do not optimise for engagement at the expense of autonomy, privacy, wellbeing, fairness or informed consent."
      );

      const button = document.querySelector("#copy-hook");
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

    fields.product.addEventListener("input", renderLoop);

    fields.demoPicker.addEventListener("change", (event) => {
      if (event.target.value) loadDemo(event.target.value);
    });

    document.querySelector("#clear-step").addEventListener("click", clearStep);
    document.querySelector("#copy-hook").addEventListener("click", copyHook);

    document.querySelectorAll(".hook-node").forEach((node) => {
      node.addEventListener("click", () => {
        const step = node.dataset.step;
        populateForm(step);
        selectStep(step);
      });
    });

    populateForm("trigger");
    selectStep("trigger");

const form = document.querySelector("#ladder-form");
    const ladderButtons = [...document.querySelectorAll(".ladder-stage")];

    const fields = {
      projectName: document.querySelector("#project-name"),
      claim: document.querySelector("#claim"),
      audience: document.querySelector("#audience"),
      data: document.querySelector("#data-evidence"),
      pattern: document.querySelector("#pattern-evidence"),
      contribution: document.querySelector("#contribution-evidence"),
      use: document.querySelector("#use-evidence"),
      change: document.querySelector("#change-evidence"),
      corroboration: document.querySelector("#corroboration-evidence"),
      notes: document.querySelector("#existing-notes"),
      limitations: document.querySelector("#limitations"),
      examplePicker: document.querySelector("#example-picker")
    };

    const output = {
      subtitle: document.querySelector("#output-subtitle"),
      badgeStage: document.querySelector("#badge-stage"),
      badgeLabel: document.querySelector("#badge-label"),
      claim: document.querySelector("#responsible-claim"),
      canSay: document.querySelector("#can-say"),
      cannotSay: document.querySelector("#cannot-say"),
      evidenceNeeded: document.querySelector("#evidence-needed"),
      exampleWording: document.querySelector("#example-wording"),
      questions: document.querySelector("#reviewer-questions"),
      nextSteps: document.querySelector("#next-steps"),
      limitations: document.querySelector("#limitations-output")
    };

    const stageData = {
      1: {
        label: "Observed data",
        color: "#7da9ff",
        summary: "The available material supports a documented observation, measurement or research output.",
        canSay:
          "You can state that the project has observed, measured, documented or produced the specified data or output, within its stated scope and method.",
        cannotSay:
          "Do not claim that the observation demonstrates a broader trend, explains why something happened, caused a change, influenced a decision or created societal benefit.",
        evidenceNeeded:
          "Add analysis, comparison, replication, validation or a defined baseline that can establish whether a meaningful pattern or association exists.",
        wording: {
          proposal:
            "The project will generate and document evidence on [topic], creating a basis for subsequent analysis and engagement.",
          report:
            "The research recorded [observation] using [method] during [timeframe].",
          webpage:
            "This project measures and documents [topic] to help build a clearer evidence base.",
          "case-study":
            "The research produced a documented dataset, method or observation that underpins further investigation.",
          briefing:
            "Available evidence records [observation]; interpretation beyond this scope requires further analysis."
        },
        questions: [
          "Is the observation accurately described, dated and traceable to an approved source?",
          "What exactly was measured or documented, using which method and within what boundaries?",
          "Could measurement, sampling, coverage or classification limits alter the interpretation?",
          "Have you separated the raw observation from interpretation or recommendation?"
        ]
      },

      2: {
        label: "Pattern or association",
        color: "#00c2a8",
        summary: "The available material supports a pattern, comparison, association or trend within the research scope.",
        canSay:
          "You can describe an observed trend, comparison or association, using appropriately qualified language such as “is associated with”, “suggests” or “was observed alongside”.",
        cannotSay:
          "Do not present association as proof of causation, claim that the finding has changed a decision, or imply that a societal benefit has already occurred.",
        evidenceNeeded:
          "Develop and test a credible pathway from the finding to potential use; examine alternative explanations, uncertainty, context and stakeholder relevance.",
        wording: {
          proposal:
            "The analysis suggests a pattern that may inform further investigation and engagement with relevant stakeholders.",
          report:
            "Within the study scope, [finding] was associated with [related factor]. This does not by itself establish causation.",
          webpage:
            "The research suggests a relationship between [topic] and [factor], helping identify questions for further local investigation.",
          "case-study":
            "The work identified an evidence-based pattern that created a basis for discussion, validation and possible application.",
          briefing:
            "The analysis identifies an association that may be relevant to [decision area], subject to contextual interpretation and further validation."
        },
        questions: [
          "Does the wording distinguish association, correlation or pattern from causation?",
          "What alternative explanations, confounders or data limitations need to be acknowledged?",
          "Who needs to interpret the finding alongside local, professional or lived experience?",
          "What decision or question could the finding inform, without overclaiming its authority?"
        ]
      },

      3: {
        label: "Plausible contribution",
        color: "#b39cff",
        summary: "There is a credible, but not yet demonstrated, pathway through which the research could contribute to use or change.",
        canSay:
          "You can set out a theory of change or plausible contribution pathway: who might use the research, what decision it could inform and what conditions would be needed.",
        cannotSay:
          "Do not claim that stakeholders have used the research, that a policy or practice has changed, or that a benefit has occurred without documented evidence.",
        evidenceNeeded:
          "Agree a meaningful engagement route; capture baseline conditions, stakeholder needs, assumptions, decisions, intended users and criteria for tracking subsequent use.",
        wording: {
          proposal:
            "The project will work with relevant stakeholders to explore how the findings could contribute to [decision, practice or capability], while testing assumptions and limits.",
          report:
            "The findings provide a plausible basis for further engagement around [decision area], but use and outcomes have not yet been demonstrated.",
          webpage:
            "The research may help inform future conversations and decisions, alongside local expertise and further evidence.",
          "case-study":
            "The team established a credible pathway through which the research could support future use, subject to stakeholder engagement and validation.",
          briefing:
            "The evidence may be relevant to [decision area]. A structured engagement process is needed to test usefulness, feasibility and limits."
        },
        questions: [
          "Who specifically could use this research, and what decision, practice or capability is in scope?",
          "What needs to happen between the research finding and any proposed outcome?",
          "Whose knowledge, consent or participation is needed to make the pathway legitimate?",
          "What baseline information will allow later change to be assessed credibly?"
        ]
      },

      4: {
        label: "Documented use",
        color: "#f4af31",
        summary: "There is evidence that a stakeholder, partner or user has accessed, adopted, cited, applied or otherwise used the research.",
        canSay:
          "You can state that a named organisation, practitioner, decision-maker or community partner has used the research in a defined way, if this is documented and attributable.",
        cannotSay:
          "Do not assume that use produced a beneficial outcome, caused a change, reached a wider population or demonstrates significance without evidence of what happened next.",
        evidenceNeeded:
          "Collect dated records of decisions, changed processes, adoption, implementation, user feedback and follow-up evidence that shows whether and how use made a difference.",
        wording: {
          proposal:
            "Early partners have indicated how they may use the research; the project will document subsequent application and resulting changes.",
          report:
            "A named partner used the research to inform [activity, decision or process], as evidenced by [record, testimony or document].",
          webpage:
            "The findings have been used by [partner type] to inform [specific activity]. The longer-term effects are still being assessed.",
          "case-study":
            "The research was adopted or used by [partner] in [specific context], creating a traceable route toward potential outcomes.",
          briefing:
            "Documented use shows relevance to practice. Further follow-up is needed to establish resulting changes and their significance."
        },
        questions: [
          "Who used the research, when, and for what specific purpose?",
          "Is there a dated, attributable record of use beyond attendance, download or general positive feedback?",
          "Did the user act differently because of the research, or did other influences drive the action?",
          "How will you distinguish uptake from meaningful change or benefit?"
        ]
      },

      5: {
        label: "Evidence of change",
        color: "#eea45b",
        summary: "There is evidence that understanding, capacity, behaviour, practice, policy, process or service has changed in relation to the research.",
        canSay:
          "You can describe a specific evidenced change and explain the research contribution, while being transparent about context, other influences and the strength of attribution.",
        cannotSay:
          "Do not claim broad, sustained or societal impact unless evidence demonstrates scale, significance, durability and a credible link to the research contribution.",
        evidenceNeeded:
          "Strengthen the evidence with independent corroboration, data on reach and significance, qualitative accounts from beneficiaries, and follow-up on durability or wider adoption.",
        wording: {
          proposal:
            "The project will build on documented early changes by gathering independent evidence of reach, significance and sustained benefit.",
          report:
            "Evidence indicates that [organisation or group] changed [practice, policy, behaviour or process] following engagement with the research, alongside [other relevant factors].",
          webpage:
            "The research has contributed to a documented change in [practice or approach]. We are continuing to assess its reach and longer-term effects.",
          "case-study":
            "The research made a documented contribution to a specific change in [practice, policy, service or capability], supported by evidence from relevant users.",
          briefing:
            "A change has been observed and documented. Independent corroboration and follow-up will help clarify its reach, significance and durability."
        },
        questions: [
          "What changed, for whom, when and in what context?",
          "What evidence links the research to that change, and what other factors also mattered?",
          "How significant is the change for beneficiaries or affected groups?",
          "Is there evidence of reach, durability, transferability or unintended consequences?"
        ]
      },

      6: {
        label: "Corroborated impact",
        color: "#58d08b",
        summary: "External, specific evidence supports a claim that research made a distinct and material contribution to a demonstrable benefit or change beyond academia.",
        canSay:
          "You can make a carefully scoped impact claim that identifies the benefit, beneficiaries, timing, reach, significance, research contribution and independent corroborating evidence.",
        cannotSay:
          "Do not generalise beyond the documented scope, claim sole causation where contribution is more accurate, or ignore limitations, negative effects, uncertainty or groups not reached.",
        evidenceNeeded:
          "Maintain the evidence trail, test durability, identify limitations and unintended effects, and update the claim if circumstances, scale or attribution change.",
        wording: {
          proposal:
            "The project builds on externally corroborated impact and will test how the approach can be sustained, adapted or responsibly extended.",
          report:
            "External evidence indicates that the research made a distinct and material contribution to [specific benefit or change] for [beneficiaries] during [period].",
          webpage:
            "Independent partners have confirmed that the research contributed to [specific change], benefiting [identified group] within the documented context.",
          "case-study":
            "The research made a distinct and material contribution to a corroborated impact beyond academia, evidenced through external sources and documented beneficiary outcomes.",
          briefing:
            "The available evidence supports a specific, bounded impact claim. Continue to distinguish contribution from sole causation and retain corroborating sources."
        },
        questions: [
          "What specific effect, change or benefit occurred beyond the research team or institution?",
          "Who benefited or was affected, and what demonstrates reach and significance?",
          "Which external sources corroborate the claim and can verify the research contribution?",
          "How are contribution, attribution, timing, limitations and other causal factors described honestly?"
        ]
      }
    };

    const examples = {
      "urban-heat": {
        projectName: "Urban heat and neighbourhood design",
        claim:
          "Analysis of Leicester neighbourhoods suggests that lower tree canopy and more impervious surfaces are associated with higher daytime land surface temperatures.",
        audience: "webpage",
        evidence: {
          data: true,
          pattern: true,
          contribution: false,
          use: false,
          change: false,
          corroboration: false
        },
        notes:
          "Satellite-derived land surface temperature analysis\nLocal geographic and canopy-cover data\nMethods note and interactive map",
        limitations:
          "The analysis measures land surface temperature, not indoor temperature or individual heat exposure.\nThe findings are associative and do not establish direct causation.\nFurther local validation and community input are needed before prioritising interventions."
      },

      "coastal-use": {
        projectName: "Satellite data for coastal monitoring",
        claim:
          "A coastal authority used multi-date satellite imagery to prioritise locations for follow-up monitoring and ground survey.",
        audience: "briefing",
        evidence: {
          data: true,
          pattern: true,
          contribution: true,
          use: true,
          change: false,
          corroboration: false
        },
        notes:
          "Multi-date satellite imagery\nTechnical methods note\nWorkshop attendance record\nAuthority meeting minutes citing the imagery\nFollow-up monitoring plan",
        limitations:
          "Satellite imagery does not replace ground survey or legal boundary assessment.\nCloud cover, image resolution and tidal conditions affect observations.\nThe wider outcomes of follow-up monitoring have not yet been evaluated."
      },

      "service-change": {
        projectName: "Experiences of access to local health and wellbeing services",
        claim:
          "Following a co-produced research process, a local service provider revised its information pathway and introduced a clearer referral guide for users.",
        audience: "report",
        evidence: {
          data: true,
          pattern: true,
          contribution: true,
          use: true,
          change: true,
          corroboration: false
        },
        notes:
          "Participant interviews and survey themes\nCo-production workshop records\nPublished revised referral guide\nProvider implementation notes\nFollow-up user feedback",
        limitations:
          "The contribution of the research should be considered alongside staff experience, service constraints and other improvement activity.\nLong-term effects on access and wellbeing have not yet been established."
      },

      "corroborated-impact": {
        projectName: "Regional retrofit evidence programme",
        claim:
          "Independent partner evidence indicates that the research made a material contribution to a regional retrofit guidance update adopted by three local authorities, improving consistency in energy-efficiency advice for residents.",
        audience: "case-study",
        evidence: {
          data: true,
          pattern: true,
          contribution: true,
          use: true,
          change: true,
          corroboration: true
        },
        notes:
          "Peer-reviewed research outputs\nProgramme theory of change\nLocal authority guidance documents\nDated meeting records\nExternal partner testimonial\nAdoption evidence from three authorities\nUser feedback and implementation monitoring",
        limitations:
          "The research was one contribution among several, including policy requirements, practitioner expertise and local delivery constraints.\nThe claim is limited to documented guidance adoption and consistency of advice; household-level energy outcomes require further evaluation."
      }
    };

    let selectedStage = 2;

    const getHighestSupportedStage = () => {
      if (fields.corroboration.checked && fields.change.checked && fields.use.checked) return 6;
      if (fields.change.checked && fields.use.checked) return 5;
      if (fields.use.checked) return 4;
      if (fields.contribution.checked) return 3;
      if (fields.pattern.checked) return 2;
      return 1;
    };

    const firstLine = (text) => {
      const clean = text.replace(/\s+/g, " ").trim();
      if (!clean) return "The project has not yet added a claim.";
      return clean;
    };

    const updateStageButtons = () => {
      ladderButtons.forEach((button) => {
        const stage = Number(button.dataset.stage);
        button.setAttribute("aria-pressed", String(stage === selectedStage));
      });

      document.documentElement.style.setProperty(
        "--active-stage-color",
        stageData[selectedStage].color
      );
    };

    const renderList = (element, items, iconClass, iconText) => {
      element.innerHTML = "";

      items.forEach((item) => {
        const listItem = document.createElement("li");
        listItem.innerHTML =
          `<span class="${iconClass}" aria-hidden="true">${iconText}</span>` +
          `<span>${item}</span>`;
        element.appendChild(listItem);
      });
    };

    const updateOutput = () => {
      const stage = stageData[selectedStage];
      const projectName = fields.projectName.value.trim() || "This project";
      const claim = firstLine(fields.claim.value);
      const audience = fields.audience.value;
      const limitations = fields.limitations.value.trim();
      const highestSupported = getHighestSupportedStage();

      const currentStageLabel = stage.label.toLowerCase();

      output.subtitle.textContent =
        `Selected stage: ${stage.label}. The evidence checklist currently supports Stage ${highestSupported} as the conservative default.`;

      output.badgeStage.textContent = `Stage ${selectedStage}`;
      output.badgeLabel.textContent = stage.label;

      output.claim.textContent =
        selectedStage > highestSupported
          ? `Caution: the checklist currently supports Stage ${highestSupported}, not ${selectedStage}. Based on the material entered, use wording no stronger than: ${stageData[highestSupported].wording[audience]}`
          : `${projectName}: ${claim}`;

      output.canSay.textContent = stage.canSay;
      output.cannotSay.textContent = stage.cannotSay;
      output.evidenceNeeded.textContent = stage.evidenceNeeded;
      output.exampleWording.textContent = stage.wording[audience];

      renderList(output.questions, stage.questions, "review-icon", "!");

      const nextSteps = [];
      const evidenceMap = [
        {
          enabled: fields.data.checked,
          label: "Retain an approved, traceable research output, data source, method or observation record."
        },
        {
          enabled: fields.pattern.checked,
          label: "Document the analysis, trend, comparison or association and its scope."
        },
        {
          enabled: fields.contribution.checked,
          label: "Set out and test a credible pathway explaining how the research could contribute to use or change."
        },
        {
          enabled: fields.use.checked,
          label: "Collect dated records showing who used the research, how and for what purpose."
        },
        {
          enabled: fields.change.checked,
          label: "Collect evidence of what changed in understanding, capacity, practice, policy, behaviour or service."
        },
        {
          enabled: fields.corroboration.checked,
          label: "Secure independent external evidence that corroborates the specific benefit or impact claim."
        }
      ];

      evidenceMap.forEach((item, index) => {
        const completed = item.enabled;
        const stageNumber = index + 1;

        nextSteps.push(
          `<strong>${completed ? "Evidence present" : "Evidence gap"} — Stage ${stageNumber}:</strong> ${item.label}`
        );
      });

      output.nextSteps.innerHTML = "";
      nextSteps.forEach((step, index) => {
        const listItem = document.createElement("li");
        const isComplete = evidenceMap[index].enabled;

        listItem.innerHTML =
          `<span class="progress-icon${isComplete ? "" : " pending"}" aria-hidden="true">${isComplete ? "✓" : "!"}</span>` +
          `<span>${step}</span>`;

        output.nextSteps.appendChild(listItem);
      });

      const caveatText = limitations
        ? `Known limitations supplied for this claim: ${limitations.replace(/\n+/g, " ")}`
        : "Add limits, uncertainty, scope boundaries and alternative explanations before communicating the claim.";

      output.limitations.textContent =
        `${caveatText} Keep the claim at the ${currentStageLabel} level unless the evidence trail justifies a stronger statement.`;
    };

    const loadExample = (key) => {
      const example = examples[key];
      if (!example) return;

      fields.projectName.value = example.projectName;
      fields.claim.value = example.claim;
      fields.audience.value = example.audience;
      fields.data.checked = example.evidence.data;
      fields.pattern.checked = example.evidence.pattern;
      fields.contribution.checked = example.evidence.contribution;
      fields.use.checked = example.evidence.use;
      fields.change.checked = example.evidence.change;
      fields.corroboration.checked = example.evidence.corroboration;
      fields.notes.value = example.notes;
      fields.limitations.value = example.limitations;
      fields.examplePicker.value = key;

      selectedStage = getHighestSupportedStage();
      updateStageButtons();
      updateOutput();
    };

    const copyReview = async () => {
      const stage = stageData[selectedStage];
      const highestSupported = getHighestSupportedStage();

      const text = [
        "EVIDENCE STRENGTH LADDER — REVIEW SUMMARY",
        "",
        `Project: ${fields.projectName.value.trim() || "Not provided"}`,
        `Selected stage: Stage ${selectedStage} — ${stage.label}`,
        `Conservative stage supported by checklist: Stage ${highestSupported} — ${stageData[highestSupported].label}`,
        "",
        "CLAIM",
        fields.claim.value.trim() || "Not provided",
        "",
        "WHAT CAN RESPONSIBLY BE SAID",
        stage.canSay,
        "",
        "WHAT CANNOT YET BE CLAIMED",
        stage.cannotSay,
        "",
        "EVIDENCE NEEDED TO PROGRESS",
        stage.evidenceNeeded,
        "",
        "EXAMPLE WORDING",
        stage.wording[fields.audience.value],
        "",
        "REVIEWER QUESTIONS",
        ...stage.questions.map((question) => `- ${question}`),
        "",
        "KNOWN LIMITATIONS",
        fields.limitations.value.trim() || "None entered.",
        "",
        "IMPORTANT",
        "This is a planning and communication aid. It does not validate research, establish causation, prove impact or replace expert review."
      ].join("\n");

      const button = document.querySelector("#copy-output");
      const originalLabel = button.textContent;

      try {
        await navigator.clipboard.writeText(text);
        button.textContent = "Review copied";
      } catch {
        button.textContent = "Copy unavailable";
      }

      window.setTimeout(() => {
        button.textContent = originalLabel;
      }, 1800);
    };

    ladderButtons.forEach((button) => {
      button.addEventListener("click", () => {
        selectedStage = Number(button.dataset.stage);
        updateStageButtons();
        updateOutput();
      });
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      selectedStage = getHighestSupportedStage();
      updateStageButtons();
      updateOutput();
    });

    [
      fields.projectName,
      fields.claim,
      fields.audience,
      fields.data,
      fields.pattern,
      fields.contribution,
      fields.use,
      fields.change,
      fields.corroboration,
      fields.notes,
      fields.limitations
    ].forEach((field) => {
      field.addEventListener("input", updateOutput);
      field.addEventListener("change", updateOutput);
    });

    fields.examplePicker.addEventListener("change", (event) => {
      if (event.target.value) loadExample(event.target.value);
    });

    document.querySelector("#reset-form").addEventListener("click", () => {
      loadExample("urban-heat");
    });

    document.querySelector("#copy-output").addEventListener("click", copyReview);

    updateStageButtons();
    updateOutput();

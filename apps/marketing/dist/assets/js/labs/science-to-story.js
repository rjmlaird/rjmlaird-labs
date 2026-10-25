const form = document.querySelector("#translator-form");

    const fields = {
      projectName: document.querySelector("#project-name"),
      sourceText: document.querySelector("#source-text"),
      audience: document.querySelector("#audience"),
      objective: document.querySelector("#objective"),
      tone: document.querySelector("#tone"),
      readingLevel: document.querySelector("#reading-level"),
      requiredFacts: document.querySelector("#required-facts"),
      caveats: document.querySelector("#caveats"),
      links: document.querySelector("#links"),
      examplePicker: document.querySelector("#example-picker")
    };

    const output = {
      subtitle: document.querySelector("#output-subtitle"),
      audience: document.querySelector("#output-audience"),
      objective: document.querySelector("#output-objective"),
      tone: document.querySelector("#output-tone"),
      level: document.querySelector("#output-level"),
      proposition: document.querySelector("#output-proposition"),
      summary: document.querySelector("#output-summary"),
      pillars: document.querySelector("#output-pillars"),
      linkedin: document.querySelector("#output-linkedin"),
      webIntro: document.querySelector("#output-web-intro"),
      subjects: document.querySelector("#output-subjects"),
      email: document.querySelector("#output-email"),
      limitations: document.querySelector("#output-limitations"),
      review: document.querySelector("#output-review")
    };

    const audienceProfiles = {
      public: {
        label: "Public",
        focus: "why this matters in everyday places and decisions",
        opening: "New work is helping build a clearer picture of",
        action: "Explore the project and share questions or local context.",
        language: "plain, everyday language"
      },
      policy: {
        label: "Policy or public sector",
        focus: "what the evidence can inform, alongside its limits",
        opening: "New analysis provides evidence that may help inform",
        action: "Review the evidence, assumptions and implications before using it in planning or policy.",
        language: "decision-relevant, cautious language"
      },
      funder: {
        label: "Funder or partner",
        focus: "the public value, progress and next-stage opportunity",
        opening: "This work demonstrates an evidence-led approach to",
        action: "Discuss how future research, evaluation or engagement could strengthen the work.",
        language: "strategic, outcome-aware language"
      },
      customer: {
        label: "Customer or client",
        focus: "the practical problem the work can help clarify",
        opening: "This work shows how better evidence can support",
        action: "Discuss whether a similar approach could help with your context.",
        language: "practical, outcome-oriented language"
      },
      journalist: {
        label: "Journalist or media contact",
        focus: "the timely finding, context and what it does not establish",
        opening: "Researchers are examining",
        action: "Read the methodology and speak to the project team before reporting conclusions.",
        language: "clear, attributable language"
      },
      technical: {
        label: "Technical peer",
        focus: "the method, scope, assumptions and contribution",
        opening: "This work investigates",
        action: "Review the methods, compare approaches and discuss validation or collaboration.",
        language: "precise, discipline-aware language"
      }
    };

    const objectiveProfiles = {
      awareness: {
        label: "Build awareness",
        cta: "Learn more about the work",
        emailAction: "Read the project overview and explore the supporting material."
      },
      signup: {
        label: "Encourage sign-up",
        cta: "Sign up for updates",
        emailAction: "Sign up to receive future findings, events and project updates."
      },
      download: {
        label: "Encourage download",
        cta: "Download the summary",
        emailAction: "Download the summary and review the supporting information."
      },
      event: {
        label: "Drive event registration",
        cta: "Register for the event",
        emailAction: "Register to hear from the project team and discuss the findings."
      },
      partnership: {
        label: "Start a partnership conversation",
        cta: "Discuss a partnership",
        emailAction: "Get in touch to discuss collaboration, validation or a related application."
      }
    };

    const toneProfiles = {
      clear: {
        label: "Clear and calm",
        descriptor: "clear, measured language"
      },
      practical: {
        label: "Practical and direct",
        descriptor: "practical, action-oriented language"
      },
      curious: {
        label: "Curious and inviting",
        descriptor: "open, exploratory language"
      },
      formal: {
        label: "Formal and concise",
        descriptor: "formal, concise language"
      },
      urgent: {
        label: "Purposeful, not alarmist",
        descriptor: "purposeful language that avoids overstating urgency"
      }
    };

    const readingLevels = {
      general: {
        label: "General public",
        summaryLength: 2
      },
      informed: {
        label: "Interested non-specialist",
        summaryLength: 3
      },
      professional: {
        label: "Professional audience",
        summaryLength: 3
      },
      technical: {
        label: "Technical specialist",
        summaryLength: 4
      }
    };

    const examples = {
      "urban-heat": {
        projectName: "Urban heat and neighbourhood design",
        sourceText:
          "This project examines how land cover, building density and tree canopy influence summer surface temperatures across neighbourhoods in Leicester. Using satellite-derived land surface temperature data and local geographic data from 2018 to 2024, the analysis identifies recurring areas of elevated daytime surface temperature. The results suggest that areas with lower canopy cover and a higher proportion of impervious surfaces often experience higher surface temperatures. The study does not measure indoor temperature, individual exposure, health outcomes or future climate impacts. Further local validation and community input are needed before findings are used to prioritise interventions.",
        audience: "public",
        objective: "awareness",
        tone: "clear",
        readingLevel: "general",
        requiredFacts:
          "The study uses satellite-derived land surface temperature data.\nThe analysis covers Leicester neighbourhoods between 2018 and 2024.\nLower tree canopy and more impervious surfaces are associated with higher daytime surface temperatures.",
        caveats:
          "The study measures surface temperature, not indoor temperature.\nIt does not measure individual exposure, health outcomes or future climate impacts.\nFurther local validation and community input are needed before prioritising interventions.",
        links:
          "Full methodology\nInteractive map\nProject contact"
      },

      "air-quality": {
        projectName: "Air-quality forecasts for everyday decisions",
        sourceText:
          "The project evaluates how short-term air-quality forecasts can be presented to help people understand expected pollution conditions. It combines regional atmospheric modelling, satellite observations and local monitoring data. Forecasts provide estimated concentrations and should be interpreted alongside local conditions and official public-health guidance. The service does not diagnose health conditions, provide personal medical advice or guarantee conditions at an individual street or indoor location.",
        audience: "public",
        objective: "download",
        tone: "practical",
        readingLevel: "informed",
        requiredFacts:
          "The forecasts combine modelling, satellite observations and local monitoring data.\nForecasts estimate expected air-quality conditions.\nOfficial public-health guidance remains important.",
        caveats:
          "Forecasts are estimates and local conditions can vary.\nThe service does not provide personal medical advice.\nIt does not guarantee conditions at an individual street or indoor location.",
        links:
          "Forecast map\nHow forecasts work\nOfficial health guidance"
      },

      "space-data": {
        projectName: "Satellite data for coastal monitoring",
        sourceText:
          "This project tests how satellite imagery can help identify changes along selected sections of the coastline. The analysis uses optical satellite imagery and compares observations across multiple dates. The work may support wider monitoring by highlighting locations for further investigation. Cloud cover, image resolution, tidal conditions and shoreline classification affect what can be observed. The analysis does not replace on-the-ground survey, legal boundary assessment or coastal-risk management decisions.",
        audience: "policy",
        objective: "partnership",
        tone: "formal",
        readingLevel: "professional",
        requiredFacts:
          "The project uses optical satellite imagery across multiple dates.\nThe analysis can highlight locations for further investigation.\nObservations are affected by cloud cover, image resolution and tidal conditions.",
        caveats:
          "The analysis does not replace on-the-ground survey.\nIt does not determine legal boundaries.\nIt should not be used alone for coastal-risk management decisions.",
        links:
          "Technical method\nProject overview\nPartnership contact"
      },

      "health-study": {
        projectName: "Community participation in a health research study",
        sourceText:
          "The study is exploring how people experience access to local health and wellbeing services. Participants will be invited to complete an interview or survey about their experiences. The research aims to identify themes that may inform future service design and further study. Participation is voluntary, responses will be handled according to the study information, and taking part will not change access to care. The study does not provide medical advice, diagnosis or immediate support.",
        audience: "public",
        objective: "signup",
        tone: "curious",
        readingLevel: "general",
        requiredFacts:
          "The study explores experiences of access to local health and wellbeing services.\nParticipation is voluntary.\nTaking part will not change access to care.",
        caveats:
          "The study does not provide medical advice, diagnosis or immediate support.\nParticipation may not directly change individual care.\nResponses will be handled according to the study information.",
        links:
          "Participant information sheet\nSign-up form\nSupport information"
      }
    };

    const splitLines = (value) => {
      return value
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 6);
    };

    const firstSentence = (text) => {
      const cleaned = text.replace(/\s+/g, " ").trim();

      if (!cleaned) {
        return "The project team has not yet added source material.";
      }

      const sentence = cleaned.match(/^.*?[.!?](?:\s|$)/);

      return sentence ? sentence[0].trim() : cleaned.slice(0, 280).trim();
    };

    const trimToLength = (text, maxLength) => {
      const cleaned = text.replace(/\s+/g, " ").trim();

      if (cleaned.length <= maxLength) {
        return cleaned;
      }

      const shortened = cleaned.slice(0, maxLength);
      const lastSpace = shortened.lastIndexOf(" ");

      return `${shortened.slice(0, lastSpace > 0 ? lastSpace : maxLength)}…`;
    };

    const renderList = (element, items, renderItem) => {
      element.innerHTML = "";

      items.forEach((item) => {
        const listItem = document.createElement("li");
        renderItem(listItem, item);
        element.appendChild(listItem);
      });
    };

    const joinNaturalLanguage = (items) => {
      if (!items.length) return "";
      if (items.length === 1) return items[0];
      if (items.length === 2) return `${items[0]} and ${items[1]}`;

      return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
    };

    const updateOutput = () => {
      const projectName = fields.projectName.value.trim() || "This project";
      const sourceText = fields.sourceText.value.trim();
      const audienceKey = fields.audience.value;
      const objectiveKey = fields.objective.value;
      const toneKey = fields.tone.value;
      const levelKey = fields.readingLevel.value;
      const facts = splitLines(fields.requiredFacts.value);
      const caveats = splitLines(fields.caveats.value);
      const links = splitLines(fields.links.value);

      const audience = audienceProfiles[audienceKey];
      const objective = objectiveProfiles[objectiveKey];
      const tone = toneProfiles[toneKey];
      const level = readingLevels[levelKey];

      const sourceOpening = firstSentence(sourceText);
      const keyFact = facts[0] || sourceOpening;
      const supportingFact = facts[1] || "The project team is sharing the available evidence and context.";
      const thirdFact = facts[2] || "The work is intended to support better questions and informed discussion.";
      const keyCaveat = caveats[0] || "The available material should be reviewed by the relevant subject-matter team before publication.";
      const allCaveats = caveats.length
        ? joinNaturalLanguage(caveats.map((item) => item.replace(/\.$/, "").toLowerCase()))
        : "the draft does not verify evidence quality, completeness or suitability for decisions";

      const proposition =
        `${projectName} offers ${audience.focus}, using verified project information to help people understand what the work can—and cannot—say.`;

      const summarySentences = [
        `${audience.opening} ${projectName.toLowerCase()}.`,
        trimToLength(sourceOpening, 300),
        `The key point is that ${keyFact.charAt(0).toLowerCase()}${keyFact.slice(1)}`,
        `Before drawing conclusions, it is important to remember that ${keyCaveat.charAt(0).toLowerCase()}${keyCaveat.slice(1)}`
      ];

      const summary = summarySentences
        .slice(0, level.summaryLength + 1)
        .join(" ");

      const pillars = [
        {
          title: "What the work looks at",
          text: keyFact
        },
        {
          title: "Why it matters",
          text: `${supportingFact} This helps audiences focus on ${audience.focus}.`
        },
        {
          title: "What needs care",
          text: `${thirdFact} However, ${keyCaveat.charAt(0).toLowerCase()}${keyCaveat.slice(1)}`
        }
      ];

      const linkedIn =
        `${projectName}\n\n` +
        `${trimToLength(sourceOpening, 320)}\n\n` +
        `For ${audience.label.toLowerCase()} audiences, the useful question is not simply “what did the project find?” but “what can this evidence help us understand or do?”\n\n` +
        `One important point: ${keyFact}\n\n` +
        `It is equally important not to overstate the result. ${keyCaveat}\n\n` +
        `${objective.cta}. ${links.length ? `Further information: ${links[0]}.` : "Please review the project information for context."}`;

      const webIntro =
        `${projectName} explores ${audience.focus}. ` +
        `${trimToLength(sourceOpening, 340)} ` +
        `The work is intended to support clearer understanding and more informed discussion, not to provide a final answer in isolation. ` +
        `Any interpretation should take account of the project’s scope and limitations, including that ${keyCaveat.charAt(0).toLowerCase()}${keyCaveat.slice(1)}`;

      const subjectLines = [
        `${projectName}: what the evidence can tell us`,
        `New project update: ${trimToLength(keyFact, 58)}`,
        `${objective.cta}: ${projectName}`
      ];

      const email =
        `Hello,\n\n` +
        `We are sharing an update from ${projectName}. ${trimToLength(sourceOpening, 240)}\n\n` +
        `The work may help with ${audience.focus}. At the same time, it is important to interpret the findings carefully: ${keyCaveat}\n\n` +
        `${objective.emailAction}\n\n` +
        `Best wishes,\nThe project team`;

      const limitations =
        `This material does not prove that ${allCaveats}. ` +
        `It should not be presented as a complete account of the evidence, a causal conclusion, individual advice, or a substitute for the full methodology and qualified review.`;

      const reviewItems = [
        "Confirm every factual statement against the approved source material and latest project information.",
        "Check that required caveats remain visible, intelligible and proportionate for the chosen audience.",
        "Ask an appropriate scientific or technical reviewer to approve terminology, interpretation and causal language.",
        "Check links, data access, permissions, image rights, names, affiliations and contact details.",
        "Confirm the call to action is ethical, accessible and appropriate to the audience and research context.",
        `Read the final version aloud for ${tone.descriptor} at a ${level.label.toLowerCase()} reading level.`
      ];

      output.subtitle.textContent =
        `Draft language for ${audience.label.toLowerCase()} audiences, written in a ${tone.label.toLowerCase()} tone and requiring expert review.`;

      output.audience.textContent = audience.label;
      output.objective.textContent = objective.label;
      output.tone.textContent = tone.label;
      output.level.textContent = level.label;
      output.proposition.textContent = proposition;
      output.summary.textContent = summary;

      renderList(output.pillars, pillars, (listItem, pillar) => {
        listItem.innerHTML = `<strong>${pillar.title}:</strong> ${pillar.text}`;
      });

      output.linkedin.textContent = linkedIn;
      output.webIntro.textContent = webIntro;

      renderList(output.subjects, subjectLines, (listItem, subject) => {
        listItem.textContent = subject;
      });

      output.email.textContent = email;
      output.limitations.textContent = limitations;

      renderList(output.review, reviewItems, (listItem, item) => {
        listItem.innerHTML =
          `<span class="review-icon" aria-hidden="true">!</span>` +
          `<span>${item}</span>`;
      });
    };

    const loadExample = (key) => {
      const example = examples[key];

      if (!example) return;

      fields.projectName.value = example.projectName;
      fields.sourceText.value = example.sourceText;
      fields.audience.value = example.audience;
      fields.objective.value = example.objective;
      fields.tone.value = example.tone;
      fields.readingLevel.value = example.readingLevel;
      fields.requiredFacts.value = example.requiredFacts;
      fields.caveats.value = example.caveats;
      fields.links.value = example.links;
      fields.examplePicker.value = key;

      updateOutput();
    };

    const copyOutput = async () => {
      const text = [
        "SCIENCE-TO-STORY TRANSLATOR — DRAFT PACK",
        "",
        `Project: ${fields.projectName.value.trim()}`,
        `Audience: ${output.audience.textContent}`,
        `Objective: ${output.objective.textContent}`,
        `Tone: ${output.tone.textContent}`,
        `Reading level: ${output.level.textContent}`,
        "",
        "ONE-LINE VALUE PROPOSITION",
        output.proposition.textContent,
        "",
        "PLAIN-ENGLISH SUMMARY",
        output.summary.textContent,
        "",
        "MESSAGING PILLARS",
        ...[...output.pillars.querySelectorAll("li")].map((item) => `- ${item.textContent}`),
        "",
        "LINKEDIN DRAFT",
        output.linkedin.textContent,
        "",
        "WEBPAGE INTRODUCTION",
        output.webIntro.textContent,
        "",
        "EMAIL SUBJECT LINES",
        ...[...output.subjects.querySelectorAll("li")].map((item) => `- ${item.textContent}`),
        "",
        "EMAIL DRAFT",
        output.email.textContent,
        "",
        "WHAT THIS DOES NOT PROVE",
        output.limitations.textContent,
        "",
        "HUMAN REVIEW REQUIRED",
        ...[...output.review.querySelectorAll("li")].map((item) => `- ${item.textContent}`)
      ].join("\n");

      const button = document.querySelector("#copy-output");
      const originalLabel = button.textContent;

      try {
        await navigator.clipboard.writeText(text);
        button.textContent = "Draft pack copied";
      } catch {
        button.textContent = "Copy unavailable";
      }

      window.setTimeout(() => {
        button.textContent = originalLabel;
      }, 1800);
    };

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      updateOutput();
    });

    [
      fields.projectName,
      fields.sourceText,
      fields.audience,
      fields.objective,
      fields.tone,
      fields.readingLevel,
      fields.requiredFacts,
      fields.caveats,
      fields.links
    ].forEach((field) => {
      field.addEventListener("input", updateOutput);
      field.addEventListener("change", updateOutput);
    });

    fields.examplePicker.addEventListener("change", (event) => {
      if (!event.target.value) return;
      loadExample(event.target.value);
    });

    document.querySelector("#reset-form").addEventListener("click", () => {
      loadExample("urban-heat");
    });

    document.querySelector("#copy-output").addEventListener("click", copyOutput);

    updateOutput();

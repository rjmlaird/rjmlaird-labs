const form = document.querySelector("#brief-form");

    const fields = {
      pageType: document.querySelector("#page-type"),
      topic: document.querySelector("#topic"),
      intent: document.querySelector("#intent"),
      conversion: document.querySelector("#conversion"),
      query: document.querySelector("#primary-query"),
      audience: document.querySelector("#audience"),
      task: document.querySelector("#user-task"),
      questions: document.querySelector("#questions"),
      examplePicker: document.querySelector("#example-picker")
    };

    const output = {
      subtitle: document.querySelector("#output-subtitle"),
      query: document.querySelector("#output-query"),
      intent: document.querySelector("#output-intent"),
      audience: document.querySelector("#output-audience"),
      task: document.querySelector("#output-task"),
      questions: document.querySelector("#output-questions"),
      structure: document.querySelector("#output-structure"),
      links: document.querySelector("#output-links"),
      url: document.querySelector("#output-url"),
      title: document.querySelector("#output-title"),
      description: document.querySelector("#output-description"),
      lengths: document.querySelector("#meta-lengths"),
      schema: document.querySelector("#output-schema"),
      cta: document.querySelector("#output-cta"),
      path: document.querySelector("#output-path"),
      checks: document.querySelector("#output-checks"),
      score: document.querySelector("#score-value")
    };

    const intentLabels = {
      commercial: "Commercial investigation",
      informational: "Informational",
      transactional: "Transactional",
      navigational: "Navigational"
    };

    const conversionOptions = {
      enquiry: {
        label: "Send an enquiry",
        path: "Page → relevant evidence → concise contact form → acknowledgement with a clear response expectation."
      },
      call: {
        label: "Book a call",
        path: "Page → fit and evidence → booking page → confirmation with useful preparation questions."
      },
      download: {
        label: "Download the resource",
        path: "Page → resource value and scope → short form or direct download → relevant thank-you journey."
      },
      newsletter: {
        label: "Join the newsletter",
        path: "Page → clear subscription value → short sign-up form → confirmation and a useful welcome resource."
      },
      tool: {
        label: "Use the tool",
        path: "Page → explain purpose and limits → tool interaction → contextual route to guidance or expert support."
      }
    };

    const pageTypeCtas = {
      service: {
        enquiry: "Discuss your project",
        call: "Book a discovery call",
        download: "Download the service guide",
        newsletter: "Get practical communications updates",
        tool: "Try a related planning tool"
      },
      article: {
        enquiry: "Ask about applying this to your organisation",
        call: "Discuss the topic with a specialist",
        download: "Download the practical checklist",
        newsletter: "Get future guides by email",
        tool: "Use the related tool"
      },
      resource: {
        enquiry: "Ask for tailored support",
        call: "Discuss your use case",
        download: "Download the full resource",
        newsletter: "Get resource updates",
        tool: "Open the tool"
      },
      "case-study": {
        enquiry: "Discuss a similar challenge",
        call: "Explore a comparable project",
        download: "Download the project summary",
        newsletter: "See future work and insights",
        tool: "Explore the related tool"
      },
      "landing-page": {
        enquiry: "Register your interest",
        call: "Reserve a place",
        download: "Get the campaign resource",
        newsletter: "Get launch updates",
        tool: "Try the campaign tool"
      },
      product: {
        enquiry: "Ask a product question",
        call: "Discuss the right option",
        download: "Download product details",
        newsletter: "Get product updates",
        tool: "Try before you buy"
      },
      event: {
        enquiry: "Ask an event question",
        call: "Register for the event",
        download: "Download the event guide",
        newsletter: "Get future event updates",
        tool: "Explore event resources"
      },
      course: {
        enquiry: "Ask about course suitability",
        call: "Discuss team training",
        download: "Download the course outline",
        newsletter: "Get learning updates",
        tool: "Try a preparatory tool"
      },
      portfolio: {
        enquiry: "Discuss a similar project",
        call: "Talk through your brief",
        download: "Download the project summary",
        newsletter: "See future projects",
        tool: "Explore the process tool"
      },
      about: {
        enquiry: "Get in touch",
        call: "Book an introductory call",
        download: "Download the profile",
        newsletter: "Follow future work",
        tool: "Explore the work"
      },
      location: {
        enquiry: "Contact the local team",
        call: "Book a local consultation",
        download: "Download local service details",
        newsletter: "Get local updates",
        tool: "Find the right service"
      },
      comparison: {
        enquiry: "Discuss the right option",
        call: "Talk through your requirements",
        download: "Download the comparison checklist",
        newsletter: "Get future buying guides",
        tool: "Use the decision tool"
      },
      faq: {
        enquiry: "Ask a question not covered here",
        call: "Speak to someone",
        download: "Download the full guide",
        newsletter: "Get support updates",
        tool: "Open the support tool"
      },
      "data-story": {
        enquiry: "Discuss the evidence",
        call: "Talk through the findings",
        download: "Download the data summary",
        newsletter: "Get future analysis",
        tool: "Explore the data tool"
      },
      "tool-page": {
        enquiry: "Ask about tailored support",
        call: "Discuss your use case",
        download: "Download the method note",
        newsletter: "Get tool updates",
        tool: "Use the tool"
      }
    };

    const pageStructures = {
      service: [
        ["Clear answer above the fold", "State who the service is for, the problem it helps solve and the practical outcome."],
        ["Relevant problems and situations", "Show the contexts in which this service is useful so visitors can recognise their own need."],
        ["What support includes", "Explain deliverables, boundaries and ways of working in clear reader language."],
        ["Evidence and experience", "Use selected examples, expertise, outcomes and collaborators where permission allows."],
        ["How engagement works", "Explain scope, stages, timing and the first conversation without hiding important constraints."],
        ["Questions and next step", "Address fit, budget range, availability or process questions before presenting one focused CTA."]
      ],

      article: [
        ["Direct answer", "Answer the core question early, in accurate plain language."],
        ["Why this matters", "Give the context a reader needs before introducing detail."],
        ["Explanation or method", "Work through the topic in logical sections, using examples, definitions and credible sources."],
        ["Related questions", "Answer practical follow-up questions that genuinely help the reader understand or act."],
        ["Limitations and nuance", "Explain uncertainty, exceptions and situations where the guidance may not apply."],
        ["Next useful reading", "Link to deeper guidance, a relevant resource or an appropriate service."]
      ],

      resource: [
        ["What this resource helps with", "State the user task, intended audience and important limitations."],
        ["How to use it", "Give a short, clear starting point before detailed instructions."],
        ["Inputs and outputs", "Explain what the user provides, what the resource produces and how to interpret it."],
        ["Method and assumptions", "Describe data sources, calculations or editorial principles in proportion to the user need."],
        ["Further support", "Link to examples, documentation, related tools or a service route."],
        ["Review information", "Show update date, ownership and a way to report an issue or suggest an improvement."]
      ],

      "case-study": [
        ["Result and context", "Begin with the client context, challenge and approved outcome without overstating causation."],
        ["The challenge", "Explain the strategic, communication or delivery problem that needed solving."],
        ["Approach and decisions", "Describe the work, reasoning, collaboration and constraints in enough detail to be credible."],
        ["Outputs and evidence", "Show approved work, qualitative feedback and metrics with appropriate context."],
        ["What changed or was learned", "Share transferable learning rather than presenting a simplistic success narrative."],
        ["Related service", "Offer a relevant next step for visitors with a similar challenge."]
      ],

      "landing-page": [
        ["Focused proposition", "State the campaign offer, intended audience, value and primary action above the fold."],
        ["Why act now", "Explain the trigger, deadline, event, problem or opportunity without manufactured urgency."],
        ["Benefits and proof", "Present outcome-oriented benefits, evidence, trusted partners or testimonials where valid."],
        ["What happens next", "Make the signup, download, purchase or booking process explicit."],
        ["Objections and reassurance", "Address common concerns such as time, cost, data use, accessibility or cancellation."],
        ["Single primary conversion", "Repeat one clear CTA with minimal distraction and a useful confirmation journey."]
      ],

      product: [
        ["Product summary", "State what the product is, who it is for and the problem it helps solve."],
        ["Features and practical benefits", "Connect product capabilities to outcomes a buyer can understand and evaluate."],
        ["Price, availability and fulfilment", "Show accurate purchase information, delivery or access details, and key conditions."],
        ["Evidence and trust", "Use real reviews, demonstrations, specifications, policies and support details where available."],
        ["Comparison or suitability guidance", "Help visitors judge fit; link to alternatives only where it genuinely supports the decision."],
        ["Purchase and support path", "Provide a clear purchase CTA plus returns, contact and support information."]
      ],

      event: [
        ["Event summary", "State what is happening, for whom, where or how it is delivered, and the date or schedule."],
        ["Why attend", "Describe the practical value, learning outcomes or experience participants can expect."],
        ["Agenda and speakers", "Provide the most useful confirmed programme details; avoid placeholders that imply certainty."],
        ["Practical information", "Cover accessibility, venue or joining details, cost, timings and cancellation arrangements."],
        ["Registration", "Present a direct booking or registration action with clear confirmation expectations."],
        ["After the event", "Explain recordings, slides, follow-up resources or related opportunities where applicable."]
      ],

      course: [
        ["Course outcome", "Say what learners will be able to understand or do after completing the course."],
        ["Who it is for", "Define prior knowledge, intended roles, accessibility needs and who may not be a good fit."],
        ["Curriculum or workshop plan", "Show modules, learning activities, duration, format and assessment or practice where relevant."],
        ["Tutor or facilitator credibility", "Introduce relevant experience without relying on generic authority claims."],
        ["Practical details", "Explain price, dates, delivery method, materials, refunds and safeguarding where relevant."],
        ["Enrolment route", "Give one clear registration or enquiry action."]
      ],

      portfolio: [
        ["Project overview", "Introduce the work, role, context, timeframe and intended audience."],
        ["Challenge and brief", "Explain what needed to change, communicate or be delivered."],
        ["Contribution", "Be specific about your responsibilities, collaborators and decision-making role."],
        ["Process and selected work", "Show meaningful artefacts, process notes or prototypes rather than an unstructured gallery."],
        ["Outcome and reflection", "Share approved evidence and what you would improve or do differently next time."],
        ["Related expertise", "Link to the service, skill area or case study that helps a potential client explore further."]
      ],

      about: [
        ["Clear positioning", "State who you help, the expertise you bring and the themes that connect your work."],
        ["Relevant experience", "Select experience that supports the visitor’s decision rather than reproducing a full CV."],
        ["How you work", "Explain values, methods, collaborations and professional standards in concrete terms."],
        ["Evidence of expertise", "Link to selected projects, talks, writing, publications or credentials."],
        ["Outside the work", "Add personal context only where it makes the professional story more human or useful."],
        ["Route to contact", "Give visitors a clear way to discuss a project, invite a talk or explore relevant services."]
      ],

      location: [
        ["Local service summary", "State the service, geographic area served and who it is intended for."],
        ["Local relevance", "Describe genuine local knowledge, delivery arrangements or context; avoid cloned location copy."],
        ["Services and practical details", "Explain scope, availability, remote or in-person options, pricing signals and response times."],
        ["Address and contact information", "Keep name, address, phone and opening information accurate and consistent where relevant."],
        ["Evidence and local trust", "Use genuine local examples, partners or reviews only where they are real and permitted."],
        ["Contact or booking path", "Make the local next step clear, including travel or accessibility information if applicable."]
      ],

      comparison: [
        ["Define the decision", "State who is choosing, what they are comparing and which context the comparison applies to."],
        ["Explain the criteria", "Set out fair decision criteria before presenting conclusions."],
        ["Side-by-side comparison", "Compare capabilities, costs, trade-offs, constraints and suitability using evidence."],
        ["When each option fits", "Offer conditional guidance rather than declaring a universal winner."],
        ["Alternatives and limitations", "Acknowledge options not covered, changes over time and your own commercial interest."],
        ["Next helpful action", "Link to a deeper guide, product page, consultation or decision-support tool."]
      ],

      faq: [
        ["Scope the help content", "State which product, service or topic the questions relate to and who the answers help."],
        ["Group questions logically", "Organise around tasks such as getting started, pricing, delivery, support and troubleshooting."],
        ["Give complete concise answers", "Answer the question directly, then link to deeper documentation where useful."],
        ["Maintain accuracy", "Show when content was reviewed and route outdated or complex questions to a human contact."],
        ["Related support routes", "Link to guides, contact, booking, product documentation or service pages."]
      ],

      "data-story": [
        ["Main finding and relevance", "State the most important insight, who it matters to and what the analysis can and cannot show."],
        ["Question and context", "Explain the real-world question, timeframe, geography and key definitions."],
        ["Evidence and method", "Describe sources, processing, assumptions and uncertainty in clear language."],
        ["Visual explanation", "Use charts, maps or tables that answer a reader question rather than decorate the page."],
        ["Interpretation and limitations", "Separate observation from inference, and explain uncertainty, missing data and caveats."],
        ["Sources and next action", "Link to data sources, methodology, related analysis and a relevant practical next step."]
      ],

      "tool-page": [
        ["Tool purpose", "Explain the problem the tool helps with, its intended users and its limits."],
        ["How it works", "Describe inputs, outputs, method and assumptions before users rely on results."],
        ["Use the tool", "Provide the interactive experience with clear labels, accessible controls and error handling."],
        ["Interpret the result", "Explain what outputs mean and what decisions they should not be used to make alone."],
        ["Privacy and data handling", "State whether inputs are stored, shared or processed externally."],
        ["Further help", "Offer documentation, a related guide or an expert-support route."]
      ]
    };

    const schemaRecommendations = {
      service: `
        Use <span class="highlight">Organization</span> or
        <span class="highlight">ProfessionalService</span> for the business, plus
        <span class="highlight">Service</span> where the offer is accurately described.
        Add <span class="highlight">FAQPage</span> only for visible, maintained questions and answers.
      `,

      article: `
        Use <span class="highlight">Article</span>, <span class="highlight">BlogPosting</span>
        or a more specific relevant subtype. Include accurate author, headline, publisher,
        image, datePublished and dateModified information where applicable.
      `,

      resource: `
        Start with <span class="highlight">WebPage</span> and
        <span class="highlight">BreadcrumbList</span>. Add a more specific type only when the
        page genuinely meets it, such as <span class="highlight">SoftwareApplication</span>,
        <span class="highlight">Dataset</span> or <span class="highlight">LearningResource</span>.
      `,

      "case-study": `
        Usually use <span class="highlight">Article</span> or
        <span class="highlight">CreativeWork</span> when that accurately represents the
        visible case-study content, alongside <span class="highlight">Organization</span>
        and <span class="highlight">BreadcrumbList</span> where appropriate.
      `,

      "landing-page": `
        Use <span class="highlight">WebPage</span>, <span class="highlight">Organization</span>
        and <span class="highlight">BreadcrumbList</span> where relevant. Add a more specialised
        type only when the visible page genuinely represents an event, course, product or other entity.
      `,

      product: `
        Use <span class="highlight">Product</span> only for a genuine product page with accurate,
        visible product information. Include offer, price, availability, shipping and return details
        where applicable; do not use Product markup for a generic service page.
      `,

      event: `
        Use <span class="highlight">Event</span> for a real event page, with accurate name,
        start date, location or attendance mode, organiser and offer information. Keep dates,
        cancellations, postponements and sold-out details current.
      `,

      course: `
        Use <span class="highlight">Course</span> when the page describes a real educational
        course. Include accurate provider, course name, description and delivery details. Use
        <span class="highlight">Event</span> separately only for specific dated sessions.
      `,

      portfolio: `
        Use <span class="highlight">CreativeWork</span>, <span class="highlight">Article</span>
        or <span class="highlight">WebPage</span> according to what the page visibly represents.
        Add <span class="highlight">Person</span> or <span class="highlight">Organization</span>
        only for truthful authorship and ownership information.
      `,

      about: `
        Use <span class="highlight">Person</span> for an individual professional profile or
        <span class="highlight">Organization</span> for a business profile. Keep roles,
        affiliations, profile links and contact information accurate and publicly appropriate.
      `,

      location: `
        Use the most specific legitimate <span class="highlight">LocalBusiness</span> subtype
        for a real local business presence. Include accurate visible name, address, phone,
        opening hours and geographic information where relevant.
      `,

      comparison: `
        Usually use <span class="highlight">Article</span> or <span class="highlight">WebPage</span>
        with clear authorship, dates and editorial ownership. Do not use product-review markup unless
        the page genuinely meets the relevant review requirements.
      `,

      faq: `
        Use <span class="highlight">FAQPage</span> only when the same questions and answers are
        visible to visitors and actively maintained. It is semantic description, not a guarantee of
        an FAQ rich result.
      `,

      "data-story": `
        Use <span class="highlight">Article</span> or <span class="highlight">Report</span>
        where accurate. Consider <span class="highlight">Dataset</span> only when a real dataset is
        published with sufficient context. Keep sources, dates, method and authorship visible.
      `,

      "tool-page": `
        Use <span class="highlight">SoftwareApplication</span> only for a genuine interactive
        application, with accurate name, category and platform details. Add
        <span class="highlight">WebPage</span> and <span class="highlight">BreadcrumbList</span>
        for ordinary page context where appropriate.
      `
    };

    const pageTypeChecks = {
      service: [
        "State what is included, what is not included, and who the service may not suit.",
        "Use real, approved evidence of experience rather than generic expertise claims.",
        "Make the contact or booking process and expected response time clear."
      ],

      article: [
        "Check factual claims, sources, dates, terminology and expert-review requirements.",
        "Add author, review and update information where it improves trust and accountability.",
        "Ensure examples clarify the topic rather than simply creating more keyword surface area."
      ],

      resource: [
        "Test all inputs, downloads, error states and instructions with a first-time user.",
        "Explain assumptions, data sources, limits and the date the resource was last reviewed.",
        "Provide a route for feedback, correction or support."
      ],

      "case-study": [
        "Confirm client approval, confidentiality boundaries and context behind every metric.",
        "Separate your own contribution from wider team or client activity.",
        "Avoid implying that a past outcome guarantees the same outcome elsewhere."
      ],

      "landing-page": [
        "Make the offer, commitment, privacy implications and next step explicit.",
        "Remove competing actions only where it improves focus without harming usability.",
        "Test the form, confirmation message and downstream email or booking journey."
      ],

      product: [
        "Confirm price, availability, variations, shipping, returns and support details are current.",
        "Use real product imagery and specifications that match what the buyer receives.",
        "Do not use product structured data for a generic service."
      ],

      event: [
        "Confirm date, timezone, attendance mode, venue, accessibility and cancellation information.",
        "Keep speakers, agenda and availability claims current as details change.",
        "Test registration, confirmation and calendar-addition flows."
      ],

      course: [
        "Confirm learning outcomes, tutor details, dates, format, prerequisites, price and refund terms.",
        "Make accessibility, safeguarding and learner-support information easy to find where relevant.",
        "Ensure promotional claims are supported by the actual course design and learner experience."
      ],

      portfolio: [
        "Clarify your role, collaborators, project stage and whether outputs are live, archived or conceptual.",
        "Use only approved client material and avoid exposing confidential details.",
        "Explain outcomes with enough context for visitors to interpret them fairly."
      ],

      about: [
        "Select experience relevant to the intended audience instead of duplicating a complete CV.",
        "Verify credentials, affiliations, speaking claims and profile links.",
        "Provide a clear route from professional credibility to a relevant service or conversation."
      ],

      location: [
        "Use unique, genuinely local content; do not clone pages and swap place names.",
        "Keep local contact details and service availability accurate wherever they appear.",
        "Check travel, remote-delivery, venue and accessibility information."
      ],

      comparison: [
        "State how options were selected and which criteria are used for comparison.",
        "Disclose commercial relationships, affiliate links or conflicts of interest clearly.",
        "Review prices, features and availability regularly because comparison pages decay quickly."
      ],

      faq: [
        "Keep every answer visible, current and written for the user rather than for search features.",
        "Link complex questions to deeper support instead of forcing long answers into an accordion.",
        "Give visitors a clear route when their question is not answered."
      ],

      "data-story": [
        "Verify source provenance, dates, geography, units, calculations and chart labels.",
        "Explain uncertainty, missing data, assumptions and what the analysis cannot establish.",
        "Make visualisations accessible with text alternatives, summaries and data tables where appropriate."
      ],

      "tool-page": [
        "Test keyboard access, validation, error messages, empty states and mobile interactions.",
        "Explain input handling, privacy, storage and any external services used.",
        "State clearly that outputs support judgement and may not suit high-stakes decisions."
      ]
    };

    const examples = {
      service: {
        pageType: "service",
        topic: "Science communication consultancy",
        intent: "commercial",
        conversion: "call",
        query: "science communication consultant",
        audience: "Research organisations and science-led teams",
        task: "Decide whether specialist communication support is relevant, understand the available help, and choose a sensible next step.",
        questions: [
          "What does a science communication consultant do?",
          "How do you make technical research understandable?",
          "When should a research team bring in communications support?"
        ]
      },

      article: {
        pageType: "article",
        topic: "How to communicate climate data clearly",
        intent: "informational",
        conversion: "download",
        query: "how to communicate climate data",
        audience: "Communications teams working with climate and environmental information",
        task: "Understand how to make climate data accurate, understandable and useful for non-specialist audiences.",
        questions: [
          "How do you explain uncertainty without weakening the message?",
          "What makes a climate chart understandable?",
          "How should a communications team review scientific claims?",
          "What context should accompany climate statistics?"
        ]
      },

      resource: {
        pageType: "resource",
        topic: "Campaign UTM builder",
        intent: "informational",
        conversion: "tool",
        query: "UTM builder for marketing campaigns",
        audience: "Marketing teams that need consistent campaign tracking",
        task: "Create clear, consistent tracking URLs and understand how campaign naming supports reporting.",
        questions: [
          "What is a UTM parameter?",
          "How should campaign names be structured?",
          "Which UTM fields are essential?"
        ]
      },

      "case-study": {
        pageType: "case-study",
        topic: "Making air-quality forecasts understandable",
        intent: "commercial",
        conversion: "enquiry",
        query: "air quality communication case study",
        audience: "Environmental-data organisations and public-information teams",
        task: "Understand how science communication can make forecast information more useful to public audiences.",
        questions: [
          "What was the communication challenge?",
          "How were scientific limitations handled?",
          "What did the final content help audiences understand?"
        ]
      },

      "landing-page": {
        pageType: "landing-page",
        topic: "Science communication workshop",
        intent: "transactional",
        conversion: "call",
        query: "science communication workshop",
        audience: "Researchers and communications professionals",
        task: "Decide whether the workshop is relevant, understand what is included and reserve a place.",
        questions: [
          "Who is the workshop for?",
          "What will participants learn?",
          "How long is the session?",
          "What does registration include?"
        ]
      },

      product: {
        pageType: "product",
        topic: "Climate communication planning template",
        intent: "transactional",
        conversion: "download",
        query: "climate communication planning template",
        audience: "Small communications teams planning public climate-information campaigns",
        task: "Understand what the template includes, assess whether it fits the project and purchase or download it confidently.",
        questions: [
          "What is included in the template?",
          "Which tools can open the files?",
          "Is it suitable for public-sector teams?",
          "What support is available after purchase?"
        ]
      },

      event: {
        pageType: "event",
        topic: "Communicating climate risk webinar",
        intent: "transactional",
        conversion: "call",
        query: "climate risk communication webinar",
        audience: "Public-sector communications teams and sustainability professionals",
        task: "Understand the webinar topic, assess relevance and register with confidence.",
        questions: [
          "When is the webinar?",
          "Who is speaking?",
          "Will a recording be available?",
          "Is the event accessible?"
        ]
      },

      course: {
        pageType: "course",
        topic: "Practical science communication for researchers",
        intent: "commercial",
        conversion: "enquiry",
        query: "science communication training for researchers",
        audience: "Early-career and established researchers",
        task: "Assess whether the training matches their communication needs and enrol in the right session.",
        questions: [
          "What will I learn?",
          "Do I need previous communications experience?",
          "Is the training online or in person?",
          "Can a team book a private session?"
        ]
      },

      portfolio: {
        pageType: "portfolio",
        topic: "Climate data storytelling project",
        intent: "commercial",
        conversion: "enquiry",
        query: "climate data storytelling portfolio",
        audience: "Organisations seeking science communication and digital-content support",
        task: "See relevant work, understand the role played and decide whether to discuss a similar project.",
        questions: [
          "What was the project challenge?",
          "What was the role and contribution?",
          "What outputs were created?",
          "What evidence or feedback is available?"
        ]
      },

      about: {
        pageType: "about",
        topic: "Science, space and sustainability communications specialist",
        intent: "navigational",
        conversion: "call",
        query: "Ryan Laird science communication",
        audience: "Organisations looking for specialist communications, content or training support",
        task: "Understand relevant expertise, working approach and the kinds of projects worth discussing.",
        questions: [
          "What experience is most relevant?",
          "Which sectors and subjects are covered?",
          "What kinds of project are a good fit?"
        ]
      },

      location: {
        pageType: "location",
        topic: "Science communication support in Leicester",
        intent: "commercial",
        conversion: "enquiry",
        query: "science communication consultant Leicester",
        audience: "Leicester and East Midlands research, education and sustainability organisations",
        task: "Find out whether local or remote science communication support is available and how to make contact.",
        questions: [
          "Which areas are served?",
          "Are in-person workshops available?",
          "Can projects be delivered remotely?",
          "How quickly can an enquiry receive a response?"
        ]
      },

      comparison: {
        pageType: "comparison",
        topic: "In-house communications team versus specialist consultant",
        intent: "commercial",
        conversion: "call",
        query: "in house communications team vs consultant",
        audience: "Research and mission-led organisations planning a communications project",
        task: "Compare options fairly and choose an approach that fits the project scope, timeline and internal capacity.",
        questions: [
          "When is an in-house team the better option?",
          "When does specialist external support help?",
          "What should be compared beyond day rates?",
          "Can both approaches work together?"
        ]
      },

      faq: {
        pageType: "faq",
        topic: "Science communication services frequently asked questions",
        intent: "informational",
        conversion: "enquiry",
        query: "science communication services FAQ",
        audience: "Potential clients considering specialist communications support",
        task: "Find clear answers about scope, process, availability and project suitability before making contact.",
        questions: [
          "What types of work do you take on?",
          "How are projects scoped?",
          "Do you work with small organisations?",
          "Can you support workshops and talks?"
        ]
      },

      "data-story": {
        pageType: "data-story",
        topic: "What changing urban temperatures mean for local planning",
        intent: "informational",
        conversion: "download",
        query: "urban temperature data local planning",
        audience: "Local authorities, journalists and interested residents",
        task: "Understand the trend, local context, data quality and appropriate planning implications.",
        questions: [
          "What does the data show?",
          "Which time period and locations are included?",
          "What are the limitations of the analysis?",
          "What actions can the findings inform?"
        ]
      },

      "tool-page": {
        pageType: "tool-page",
        topic: "SEO Brief-to-Page Lab",
        intent: "informational",
        conversion: "tool",
        query: "SEO content brief tool",
        audience: "Marketing and communications teams planning useful webpages",
        task: "Create a people-first page brief covering audience needs, structure, metadata and editorial checks.",
        questions: [
          "What does the tool generate?",
          "How should I use the recommendations?",
          "Does the tool predict rankings?",
          "What data does the tool store?"
        ]
      }
    };

    const getQuestions = (value) => {
      return value
        .split("\n")
        .map((question) => question.trim())
        .filter(Boolean)
        .slice(0, 6);
    };

    const safeSlug = (value) => {
      return value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 42) || "page";
    };

    const pageTypeLabel = (pageType) => {
      const selectedOption = fields.pageType.querySelector(`option[value="${pageType}"]`);
      return selectedOption ? selectedOption.textContent : "Page";
    };

    const renderList = (element, items, renderItem) => {
      element.innerHTML = "";

      items.forEach((item) => {
        const listItem = document.createElement("li");
        renderItem(listItem, item);
        element.appendChild(listItem);
      });
    };

    const createTitle = (topic, query, pageType) => {
      const subject = topic || query || "Useful information";

      const suffixes = {
        service: "Specialist Support",
        article: "Guide",
        resource: "Resource",
        "case-study": "Case Study",
        "landing-page": "Register Now",
        product: "Details and Access",
        event: "Event Details",
        course: "Course Details",
        portfolio: "Portfolio Project",
        about: "About",
        location: "Local Support",
        comparison: "Comparison Guide",
        faq: "Frequently Asked Questions",
        "data-story": "Data Story",
        "tool-page": "Interactive Tool"
      };

      return `${subject} | ${suffixes[pageType]}`;
    };

    const createDescription = (topic, audience, task, pageType) => {
      const subject = topic || "this topic";
      const people = audience || "the intended audience";
      const action = task || "understand the topic and choose a useful next step";

      const prefixes = {
        service: "Practical support for",
        article: "A clear guide to",
        resource: "A practical resource for",
        "case-study": "See how this project approached",
        "landing-page": "Explore",
        product: "Find out about",
        event: "Join",
        course: "Learn through",
        portfolio: "Explore the work behind",
        about: "Meet the specialist behind",
        location: "Local support for",
        comparison: "A practical comparison of",
        faq: "Answers to common questions about",
        "data-story": "Explore the evidence behind",
        "tool-page": "Use"
      };

      return `${prefixes[pageType]} ${subject} for ${people}. Understand the key considerations and ${action.charAt(0).toLowerCase()}${action.slice(1)}`
        .replace(/\s+/g, " ")
        .trim();
    };

    const createLinks = (topic, pageType) => {
      const subject = topic || "this topic";

      const linksByType = {
        service: [
          ["Evidence", `Link to a relevant case study or example showing experience with ${subject}.`],
          ["Depth", `Link to an explainer, article or resource that demonstrates subject knowledge.`],
          ["Decision", `Link to process, booking, contact or related service information.`]
        ],
        article: [
          ["Context", `Link to a foundational explainer or glossary page for readers new to ${subject}.`],
          ["Depth", `Link to a case study, research source or related article that expands the argument.`],
          ["Action", `Link to a relevant tool, checklist, service or support route.`]
        ],
        resource: [
          ["Method", `Link to documentation or an explainer that describes how ${subject} works.`],
          ["Example", `Link to a worked example, case study or demonstration.`],
          ["Support", `Link to a service, contact route or feedback channel for users who need help.`]
        ],
        "case-study": [
          ["Related service", `Link to the relevant service behind the ${subject} work.`],
          ["Supporting insight", `Link to a guide explaining the strategy, method or subject area.`],
          ["Next project", `Link to an enquiry route for organisations facing a similar challenge.`]
        ],
        "landing-page": [
          ["Proof", `Link to relevant evidence, speaker information, testimonials or project examples.`],
          ["Practical detail", `Link to terms, accessibility, privacy or event information where needed.`],
          ["Next action", `Link to the direct registration, booking or enquiry route.`]
        ],
        product: [
          ["Specifications", `Link to detailed product information, documentation or compatibility guidance.`],
          ["Confidence", `Link to shipping, returns, support or licensing information.`],
          ["Decision", `Link to an appropriate comparison, FAQ or product-selection guide.`]
        ],
        event: [
          ["Speaker detail", `Link to speaker profiles, prior talks or relevant expertise.`],
          ["Practical information", `Link to venue, access, cancellation, joining instructions or FAQ content.`],
          ["Afterwards", `Link to related resources, recordings or future events.`]
        ],
        course: [
          ["Curriculum depth", `Link to the full outline, reading list, sample material or prerequisites.`],
          ["Facilitator evidence", `Link to relevant professional profile, talks, projects or teaching experience.`],
          ["Enrolment support", `Link to pricing, terms, accessibility or team-training information.`]
        ],
        portfolio: [
          ["Case-study depth", `Link to the fuller case study, process note or selected project artefacts.`],
          ["Relevant capability", `Link to the service or skill area demonstrated by ${subject}.`],
          ["Conversation", `Link to a project enquiry or booking route.`]
        ],
        about: [
          ["Work", `Link to selected case studies, projects or portfolio evidence.`],
          ["Perspective", `Link to articles, talks, research or resources that show how the work is approached.`],
          ["Contact", `Link to a clearly scoped service or enquiry route.`]
        ],
        location: [
          ["Local evidence", `Link to genuine local work, partners, events or relevant local resources.`],
          ["Service detail", `Link to the underlying service page rather than duplicating all content.`],
          ["Contact", `Link to local booking, directions, availability or contact information.`]
        ],
        comparison: [
          ["Criteria", `Link to deeper guides explaining the factors used to assess ${subject}.`],
          ["Alternatives", `Link to relevant product, service or implementation pages for each option.`],
          ["Decision support", `Link to a consultation, checklist or planning tool.`]
        ],
        faq: [
          ["Deeper answer", `Link each complex question to a full guide or documentation page.`],
          ["Support", `Link to contact, booking or support routes when self-service is insufficient.`],
          ["Related topic", `Link to a relevant service, resource or product page.`]
        ],
        "data-story": [
          ["Method", `Link to sources, methodology, data documentation and definitions behind ${subject}.`],
          ["Context", `Link to a related explainer, policy context or prior analysis.`],
          ["Action", `Link to a relevant tool, downloadable data summary or expert-support route.`]
        ],
        "tool-page": [
          ["Method", `Link to clear documentation explaining how ${subject} works and its assumptions.`],
          ["Interpretation", `Link to guidance, examples or a help page for understanding outputs.`],
          ["Support", `Link to a relevant service or contact route for tailored help.`]
        ]
      };

      return linksByType[pageType] || linksByType.service;
    };

    const calculateScore = (data) => {
      const inputs = [
        data.pageType,
        data.topic,
        data.query,
        data.audience,
        data.task,
        data.questions.length >= 2,
        data.intent,
        data.conversion
      ];

      return inputs.filter(Boolean).length;
    };

    const updatePlan = () => {
      const data = {
        pageType: fields.pageType.value,
        topic: fields.topic.value.trim(),
        intent: fields.intent.value,
        conversion: fields.conversion.value,
        query: fields.query.value.trim(),
        audience: fields.audience.value.trim(),
        task: fields.task.value.trim(),
        questions: getQuestions(fields.questions.value)
      };

      const title = createTitle(data.topic, data.query, data.pageType);
      const description = createDescription(
        data.topic,
        data.audience,
        data.task,
        data.pageType
      );

      const score = calculateScore(data);
      const conversion = conversionOptions[data.conversion];
      const cta = pageTypeCtas[data.pageType]?.[data.conversion] || conversion.label;
      const pageLabel = pageTypeLabel(data.pageType);
      const slug = safeSlug(data.topic || data.query);

      output.subtitle.textContent =
        `A ${pageLabel.toLowerCase()} plan for ${data.topic || "your selected topic"}.`;

      output.query.textContent = data.query || "Add a clear primary query";
      output.intent.textContent = intentLabels[data.intent];
      output.audience.textContent = data.audience || "Add a defined audience";
      output.task.textContent = data.task || "Add the job the reader needs to complete";

      renderList(
        output.questions,
        data.questions.length
          ? data.questions
          : ["Add meaningful questions that this page should answer."],
        (listItem, question) => {
          listItem.textContent = question;
        }
      );

      renderList(output.structure, pageStructures[data.pageType], (listItem, section) => {
        const [heading, detail] = section;
        listItem.innerHTML = `<strong>${heading}:</strong> ${detail}`;
      });

      renderList(output.links, createLinks(data.topic, data.pageType), (listItem, link) => {
        const [heading, detail] = link;
        listItem.innerHTML = `<strong>${heading}:</strong> ${detail}`;
      });

      output.url.textContent = `example.com/${data.pageType}/${slug}`;
      output.title.textContent = title;
      output.description.textContent = description;

      output.lengths.textContent =
        `Title: ${title.length} characters. Description: ${description.length} characters. ` +
        "Length is guidance only; clarity and accuracy are more important.";

      output.schema.innerHTML = schemaRecommendations[data.pageType];

      output.cta.textContent = `Primary CTA: ${cta}`;
      output.path.textContent = conversion.path;

      const baseChecks = [
        {
          state: data.audience && data.task ? "pass" : "fail",
          icon: data.audience && data.task ? "✓" : "×",
          text: "The page names a specific audience and a real task."
        },
        {
          state: data.query ? "pass" : "fail",
          icon: data.query ? "✓" : "×",
          text: "The primary query describes the page naturally and accurately."
        },
        {
          state: data.questions.length >= 2 ? "pass" : "warn",
          icon: data.questions.length >= 2 ? "✓" : "!",
          text: "The page addresses meaningful related questions rather than thin keyword variations."
        },
        {
          state: "warn",
          icon: "!",
          text: "Check the title and meta description represent the page honestly without overpromising."
        },
        {
          state: "warn",
          icon: "!",
          text: "Check headings, image alternatives, mobile layout, page performance and form labels."
        }
      ];

      const checks = [
        ...baseChecks,
        ...(pageTypeChecks[data.pageType] || []).map((text) => ({
          state: "warn",
          icon: "!",
          text
        }))
      ];

      renderList(output.checks, checks, (listItem, check) => {
        listItem.innerHTML =
          `<span class="check-icon ${check.state}">${check.icon}</span>` +
          `<span>${check.text}</span>`;
      });

      output.score.textContent = `${score}/8`;
    };

    const loadExample = (exampleKey) => {
      const example = examples[exampleKey];

      if (!example) return;

      fields.pageType.value = example.pageType;
      fields.topic.value = example.topic;
      fields.intent.value = example.intent;
      fields.conversion.value = example.conversion;
      fields.query.value = example.query;
      fields.audience.value = example.audience;
      fields.task.value = example.task;
      fields.questions.value = example.questions.join("\n");
      fields.examplePicker.value = exampleKey;

      updatePlan();
    };

    const copyBrief = async () => {
      const data = {
        pageType: fields.pageType.value,
        topic: fields.topic.value.trim(),
        intent: fields.intent.options[fields.intent.selectedIndex].text,
        conversion: output.cta.textContent,
        query: fields.query.value.trim(),
        audience: fields.audience.value.trim(),
        task: fields.task.value.trim(),
        questions: getQuestions(fields.questions.value)
      };

      const structure = pageStructures[data.pageType]
        .map(([heading, detail], index) => `${index + 1}. ${heading}: ${detail}`)
        .join("\n");

      const links = createLinks(data.topic, data.pageType)
        .map(([heading, detail]) => `- ${heading}: ${detail}`)
        .join("\n");

      const text = [
        "SEO BRIEF-TO-PAGE LAB",
        "",
        `Page type: ${pageTypeLabel(data.pageType)}`,
        `Topic: ${data.topic}`,
        `Search intent: ${data.intent}`,
        `Primary query: ${data.query}`,
        `Audience: ${data.audience}`,
        `User task: ${data.task}`,
        "",
        "RELATED QUESTIONS",
        ...data.questions.map((question) => `- ${question}`),
        "",
        "SUGGESTED PAGE STRUCTURE",
        structure,
        "",
        "INTERNAL LINK OPPORTUNITIES",
        links,
        "",
        `SUGGESTED TITLE: ${output.title.textContent}`,
        `SUGGESTED META DESCRIPTION: ${output.description.textContent}`,
        "",
        `SCHEMA GUIDANCE: ${output.schema.textContent.trim().replace(/\s+/g, " ")}`,
        "",
        data.conversion,
        "",
        "EDITORIAL PRINCIPLE",
        "Write for the audience task first. Use search, links, metadata and structured data to help the right people discover and understand the page."
      ].join("\n");

      const button = document.querySelector("#copy-brief");
      const originalLabel = button.textContent;

      try {
        await navigator.clipboard.writeText(text);
        button.textContent = "Brief copied";
      } catch {
        button.textContent = "Copy unavailable";
      }

      window.setTimeout(() => {
        button.textContent = originalLabel;
      }, 1800);
    };

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      updatePlan();
    });

    [
      fields.pageType,
      fields.topic,
      fields.intent,
      fields.conversion,
      fields.query,
      fields.audience,
      fields.task,
      fields.questions
    ].forEach((field) => {
      field.addEventListener("input", updatePlan);
      field.addEventListener("change", updatePlan);
    });

    fields.examplePicker.addEventListener("change", (event) => {
      if (!event.target.value) return;
      loadExample(event.target.value);
    });

    document.querySelector("#reset-form").addEventListener("click", () => {
      loadExample("service");
    });

    document.querySelector("#copy-brief").addEventListener("click", copyBrief);

    updatePlan();

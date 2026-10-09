const form = document.querySelector("#clv-form");

    const fields = {
      segment: document.querySelector("#segment-name"),
      avgOrderValue: document.querySelector("#avg-order-value"),
      frequency: document.querySelector("#purchase-frequency"),
      margin: document.querySelector("#gross-margin"),
      retention: document.querySelector("#annual-retention"),
      cac: document.querySelector("#customer-acquisition-cost"),
      serviceCost: document.querySelector("#annual-service-cost"),
      discountRate: document.querySelector("#discount-rate"),
      years: document.querySelector("#projection-years"),
      demoPicker: document.querySelector("#demo-picker")
    };

    const display = {
      segment: document.querySelector("#segment-display"),
      clvBadge: document.querySelector("#clv-badge"),
      pvClv: document.querySelector("#pv-clv"),
      netClv: document.querySelector("#net-clv"),
      ratio: document.querySelector("#clv-cac-ratio"),
      ratioNote: document.querySelector("#ratio-note"),
      payback: document.querySelector("#payback-period"),
      tableBody: document.querySelector("#cashflow-table-body"),
      barChart: document.querySelector("#bar-chart"),
      revenueInsight: document.querySelector("#revenue-insight"),
      retentionInsight: document.querySelector("#retention-insight"),
      acquisitionInsight: document.querySelector("#acquisition-insight"),
      guidanceList: document.querySelector("#guidance-list")
    };

    const defaultValues = {
      segment: "Professional subscription customers",
      avgOrderValue: 240,
      frequency: 2.5,
      margin: 68,
      retention: 75,
      cac: 310,
      serviceCost: 45,
      discountRate: 12,
      years: 5
    };

    let latestResult = null;

    const money = (value) =>
      new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
        maximumFractionDigits: 0
      }).format(Number.isFinite(value) ? value : 0);

    const moneyPrecise = (value) =>
      new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
        maximumFractionDigits: 2
      }).format(Number.isFinite(value) ? value : 0);

    const number = (value, digits = 1) =>
      new Intl.NumberFormat("en-GB", {
        maximumFractionDigits: digits
      }).format(Number.isFinite(value) ? value : 0);

    const getInputs = () => ({
      segment: fields.segment.value.trim() || "Selected customer segment",
      avgOrderValue: Math.max(0, Number(fields.avgOrderValue.value) || 0),
      frequency: Math.max(0, Number(fields.frequency.value) || 0),
      margin: Math.min(100, Math.max(0, Number(fields.margin.value) || 0)) / 100,
      retention: Math.min(100, Math.max(0, Number(fields.retention.value) || 0)) / 100,
      cac: Math.max(0, Number(fields.cac.value) || 0),
      serviceCost: Math.max(0, Number(fields.serviceCost.value) || 0),
      discountRate: Math.min(100, Math.max(0, Number(fields.discountRate.value) || 0)) / 100,
      years: Math.min(10, Math.max(1, Math.round(Number(fields.years.value) || 1)))
    });

    const calculateCLV = (input) => {
      const annualRevenue = input.avgOrderValue * input.frequency;
      const annualGrossContribution = annualRevenue * input.margin;
      const annualNetContribution = annualGrossContribution - input.serviceCost;

      let cumulativePV = 0;
      let paybackYear = null;
      const rows = [];

      for (let year = 1; year <= input.years; year += 1) {
        const activeCustomers = Math.pow(input.retention, year - 1);
        const revenue = annualRevenue * activeCustomers;
        const contribution = annualNetContribution * activeCustomers;
        const discountFactor = 1 / Math.pow(1 + input.discountRate, year);
        const presentValue = contribution * discountFactor;
        const beforePV = cumulativePV;

        cumulativePV += presentValue;

        if (paybackYear === null && cumulativePV >= input.cac && presentValue > 0) {
          const remaining = input.cac - beforePV;
          paybackYear = (year - 1) + Math.max(0, remaining / presentValue);
        }

        rows.push({
          year,
          activeCustomers,
          revenue,
          contribution,
          discountFactor,
          presentValue,
          cumulativePV
        });
      }

      return {
        ...input,
        annualRevenue,
        annualGrossContribution,
        annualNetContribution,
        pvClv: cumulativePV,
        netClv: cumulativePV - input.cac,
        ratio: input.cac > 0 ? cumulativePV / input.cac : null,
        paybackYear,
        rows
      };
    };

    const renderResults = (result) => {
      latestResult = result;

      display.segment.textContent = result.segment;
      display.pvClv.textContent = money(result.pvClv);
      display.netClv.textContent = money(result.netClv);
      display.clvBadge.textContent = money(result.netClv);

      if (result.ratio === null) {
        display.ratio.textContent = "No CAC entered";
        display.ratioNote.textContent = "Enter acquisition cost to estimate a CLV-to-CAC ratio.";
      } else {
        display.ratio.textContent = `${number(result.ratio, 1)} : 1`;

        if (result.ratio < 1) {
          display.ratioNote.textContent =
            "Forecast CLV is lower than CAC before considering further overheads or uncertainty.";
        } else if (result.ratio < 3) {
          display.ratioNote.textContent =
            "The relationship covers CAC in this forecast, but assess cash payback, risk and operating costs.";
        } else {
          display.ratioNote.textContent =
            "The forecast indicates meaningful headroom over CAC; validate segment quality, payback timing and uncertainty.";
        }
      }

      display.payback.textContent = result.paybackYear
        ? `${number(result.paybackYear, 1)} years`
        : "Not within horizon";

      display.tableBody.innerHTML = "";

      result.rows.forEach((row) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td class="emphasis">Year ${row.year}</td>
          <td>${number(row.activeCustomers * 100, 0)}%</td>
          <td>${moneyPrecise(row.revenue)}</td>
          <td>${moneyPrecise(row.contribution)}</td>
          <td>${number(row.discountFactor, 3)}</td>
          <td class="emphasis">${moneyPrecise(row.presentValue)}</td>
          <td class="emphasis">${moneyPrecise(row.cumulativePV)}</td>
        `;
        display.tableBody.appendChild(tr);
      });

      renderBars(result.rows);

      const annualRevenueText = money(result.annualRevenue);
      const grossContributionText = money(result.annualGrossContribution);
      const netContributionText = money(result.annualNetContribution);
      const retentionPercent = number(result.retention * 100, 0);
      const churnPercent = number((1 - result.retention) * 100, 0);

      display.revenueInsight.innerHTML =
        `<strong>${annualRevenueText}</strong> expected annual revenue per initially acquired customer, translating to <strong>${grossContributionText}</strong> gross contribution before annual service costs and <strong>${netContributionText}</strong> after them.`;

      const finalActive = result.rows[result.rows.length - 1].activeCustomers * 100;
      display.retentionInsight.innerHTML =
        `<strong>${retentionPercent}% annual retention</strong> implies ${churnPercent}% annual churn. By year ${result.years}, the model expects roughly <strong>${number(finalActive, 0)}%</strong> of the original cohort to remain active.`;

      if (result.netClv < 0) {
        display.acquisitionInsight.innerHTML =
          `<strong>The current scenario is negative after CAC by ${money(Math.abs(result.netClv))}.</strong> Investigate CAC, margin, service cost, price, frequency and retention before scaling acquisition.`;
      } else if (!result.paybackYear) {
        display.acquisitionInsight.innerHTML =
          `<strong>The scenario is positive over the full horizon but does not repay CAC within ${result.years} years.</strong> Check whether the cash-payback period fits your financing and risk tolerance.`;
      } else {
        display.acquisitionInsight.innerHTML =
          `<strong>CAC is repaid at approximately ${number(result.paybackYear, 1)} years.</strong> Use this as a scenario estimate, then test by acquisition channel and customer cohort.`;
      }

      const guidance = [
        "Use cohort-level data. Customers acquired through different channels, plans, geographies or time periods can have very different retention, margin and service costs.",
        "Calculate contribution, not revenue alone. Include cost of goods or delivery, payment fees, discounts, refunds, support and retention expenditure where material.",
        "Distinguish observed history from forecasts. Historical CLV describes past cohorts; predictive CLV adds assumptions about future behaviour and should show uncertainty.",
        "Compare CLV with CAC alongside payback period, not with a universal ratio target. Working capital, gross margin, growth rate and risk tolerance differ by business.",
        "Do not use CLV estimates to justify manipulative retention, discriminatory pricing or excessive data collection. Design retention around genuine customer value and informed choice.",
        "Reforecast when pricing, product mix, retention, attribution, service costs or macro conditions change, and document the data source and calculation definition."
      ];

      display.guidanceList.innerHTML = "";
      guidance.forEach((tip) => {
        const item = document.createElement("li");
        item.innerHTML =
          `<span class="guidance-icon" aria-hidden="true">✓</span><span>${tip}</span>`;
        display.guidanceList.appendChild(item);
      });
    };

    const renderBars = (rows) => {
      display.barChart.innerHTML = "";

      const maxValue = Math.max(...rows.map((row) => Math.max(0, row.presentValue)), 1);

      rows.forEach((row) => {
        const column = document.createElement("div");
        column.className = "bar-column";

        const height = Math.max(4, (Math.max(0, row.presentValue) / maxValue) * 100);

        column.innerHTML = `
          <div class="bar-shell">
            <div class="bar" style="height: ${height}%;">
              <span class="bar-value">${money(row.presentValue)}</span>
            </div>
          </div>
          <span class="bar-label">Year ${row.year}</span>
        `;

        display.barChart.appendChild(column);
      });
    };

    const calculateAndRender = () => {
      const result = calculateCLV(getInputs());
      renderResults(result);
    };

    const setValues = (values) => {
      fields.segment.value = values.segment;
      fields.avgOrderValue.value = values.avgOrderValue;
      fields.frequency.value = values.frequency;
      fields.margin.value = values.margin;
      fields.retention.value = values.retention;
      fields.cac.value = values.cac;
      fields.serviceCost.value = values.serviceCost;
      fields.discountRate.value = values.discountRate;
      fields.years.value = values.years;
    };

    const loadDemo = (demo) => {
      const demos = {
        subscription: {
          segment: "Professional subscription customers",
          avgOrderValue: 240,
          frequency: 2.5,
          margin: 68,
          retention: 75,
          cac: 310,
          serviceCost: 45,
          discountRate: 12,
          years: 5
        },
        ecommerce: {
          segment: "Repeat-purchase ecommerce customers",
          avgOrderValue: 54,
          frequency: 4.8,
          margin: 55,
          retention: 58,
          cac: 68,
          serviceCost: 12,
          discountRate: 12,
          years: 5
        },
        saas: {
          segment: "Mid-market B2B SaaS accounts",
          avgOrderValue: 12000,
          frequency: 1,
          margin: 78,
          retention: 88,
          cac: 14500,
          serviceCost: 1350,
          discountRate: 12,
          years: 5
        }
      };

      if (!demos[demo]) return;

      setValues(demos[demo]);
      fields.demoPicker.value = demo;
      calculateAndRender();
    };

    const copyResults = async () => {
      if (!latestResult) calculateAndRender();

      const result = latestResult;
      const lines = [
        "CUSTOMER LIFETIME VALUE SCENARIO",
        "",
        `Customer segment: ${result.segment}`,
        `Average order / period revenue: ${moneyPrecise(result.avgOrderValue)}`,
        `Purchases / periods per year: ${number(result.frequency, 1)}`,
        `Gross contribution margin: ${number(result.margin * 100, 0)}%`,
        `Annual retention: ${number(result.retention * 100, 0)}%`,
        `Annual service / retention cost: ${moneyPrecise(result.serviceCost)}`,
        `Customer acquisition cost: ${moneyPrecise(result.cac)}`,
        `Annual discount rate: ${number(result.discountRate * 100, 0)}%`,
        `Projection horizon: ${result.years} years`,
        "",
        `Present-value CLV before CAC: ${moneyPrecise(result.pvClv)}`,
        `Net CLV after CAC: ${moneyPrecise(result.netClv)}`,
        `CLV:CAC ratio: ${result.ratio === null ? "Not available" : `${number(result.ratio, 2)}:1`}`,
        `Estimated CAC payback: ${result.paybackYear ? `${number(result.paybackYear, 2)} years` : "Not within projection horizon"}`,
        "",
        "Note: This is a scenario forecast based on supplied assumptions. Validate with cohort data, margins, acquisition attribution, costs to serve, retention patterns and cash-flow requirements."
      ];

      const button = document.querySelector("#copy-results");
      const originalLabel = button.textContent;

      try {
        await navigator.clipboard.writeText(lines.join("\n"));
        button.textContent = "Summary copied";
      } catch {
        button.textContent = "Copy unavailable";
      }

      window.setTimeout(() => {
        button.textContent = originalLabel;
      }, 1800);
    };

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      calculateAndRender();
    });

    document.querySelector("#reset-model").addEventListener("click", () => {
      setValues(defaultValues);
      fields.demoPicker.value = "";
      calculateAndRender();
    });

    document.querySelector("#copy-results").addEventListener("click", copyResults);

    fields.demoPicker.addEventListener("change", (event) => {
      if (event.target.value) loadDemo(event.target.value);
    });

    calculateAndRender();

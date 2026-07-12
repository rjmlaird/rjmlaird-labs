import { useMemo, useState } from 'react';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { parseCsv, parseJson, samplePoints, type GraphPoint } from '../lib/graph';

type GraphType = 'line' | 'bar' | 'scatter';
type InputMode = 'json' | 'csv';

type Props = {
  initialData?: GraphPoint[];
};

export default function GraphLab({ initialData = samplePoints }: Props) {
  const [graphType, setGraphType] = useState<GraphType>('line');
  const [inputMode, setInputMode] = useState<InputMode>('json');
  const [dataText, setDataText] = useState(JSON.stringify(initialData, null, 2));

  const parsedData = useMemo(() => {
    return inputMode === 'json' ? parseJson(dataText) : parseCsv(dataText);
  }, [dataText, inputMode]);

  const series = useMemo(() => {
    return [{ name: 'Series', data: parsedData.map((d) => ({ x: d.x, y: d.y })) }];
  }, [parsedData]);

  const options: ApexOptions = useMemo(
    () => ({
      chart: {
        id: 'graph-lab',
        toolbar: {
          show: true,
        },
        zoom: {
          enabled: true,
        },
        animations: {
          enabled: true,
        },
        background: 'transparent',
      },
      colors: ['#00c2a8'],
      dataLabels: {
        enabled: false,
      },
      stroke: {
        width: graphType === 'bar' ? 0 : 3,
        curve: 'smooth',
      },
      fill: {
        opacity: graphType === 'bar' ? 1 : 0.25,
      },
      markers: {
        size: graphType === 'scatter' ? 6 : 4,
        colors: ['#f5a623'],
      },
      grid: {
        borderColor: 'rgba(238, 242, 246, 0.12)',
      },
      xaxis: {
        type: 'numeric',
        title: {
          text: 'X value',
          style: {
            color: '#9aa5b1',
          },
        },
        labels: {
          style: {
            colors: '#9aa5b1',
          },
        },
      },
      yaxis: {
        title: {
          text: 'Y value',
          style: {
            color: '#9aa5b1',
          },
        },
        labels: {
          style: {
            colors: '#9aa5b1',
          },
        },
      },
      legend: {
        position: 'top',
        labels: {
          colors: '#eef2f6',
        },
      },
      tooltip: {
        theme: 'dark',
      },
      responsive: [
        {
          breakpoint: 768,
          options: {
            chart: {
              height: 360,
            },
            legend: {
              position: 'bottom',
            },
          },
        },
      ],
    }),
    [graphType]
  );

  return (
    <div className="graph-lab">
      <section className="controls">
        <label>
          Input mode
          <select value={inputMode} onChange={(e) => setInputMode(e.target.value as InputMode)}>
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
          </select>
        </label>

        <label>
          Graph type
          <select value={graphType} onChange={(e) => setGraphType(e.target.value as GraphType)}>
            <option value="line">Line</option>
            <option value="bar">Bar</option>
            <option value="scatter">Scatter</option>
          </select>
        </label>

        <label>
          Data
          <textarea
            value={dataText}
            onChange={(e) => setDataText(e.target.value)}
            rows={14}
            spellCheck={false}
          />
        </label>

        <p className="hint">
          CSV format: x,y on each row, with a header line.
        </p>
      </section>

      <section className="chart-panel">
        {parsedData.length === 0 ? (
          <p className="empty">Enter valid data to render the chart.</p>
        ) : (
          <Chart
            options={options}
            series={series}
            type={graphType === 'scatter' ? 'scatter' : graphType}
            height={470}
            width="100%"
          />
        )}
      </section>
    </div>
  );
}

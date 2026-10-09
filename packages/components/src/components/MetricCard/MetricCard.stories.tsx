import type { Meta, StoryObj } from "@storybook/react-vite";
import { MetricCard } from "./MetricCard";

const meta = {
  title: "Components/MetricCard",
  component: MetricCard,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: "Maturity: **Candidate**. Missing values show a dash and a reason." } } },
  args: {
    label: "PM2.5, Leicester centre",
    value: 9.4,
    unit: "\u00b5g/m\u00b3",
    source: "AURN",
    freshness: "Last updated 3 hours ago",
  },
} satisfies Meta<typeof MetricCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Typical: Story = {};
export const MissingValue: Story = {
  args: { value: null, missingReason: "No reading from the station in the last 6 hours." },
};
export const LongSource: Story = {
  args: {
    source:
      "A deliberately long headline that checks whether the layout stays readable when real writing gets in the way",
  },
};

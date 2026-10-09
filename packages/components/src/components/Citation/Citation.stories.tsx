import type { Meta, StoryObj } from "@storybook/react-vite";
import { Citation } from "./Citation";

const meta = {
  title: "Components/Citation",
  component: Citation,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: "Maturity: **Candidate**. Source, publisher, date and a persistent link." } } },
  args: {
    source: "Copernicus Atmosphere Monitoring Service, regional reanalysis",
    publisher: "ECMWF",
    updated: "12 Sep 2026",
    href: "#",
  },
} satisfies Meta<typeof Citation>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Typical: Story = {};
export const LongText: Story = {
  args: {
    source:
      "A deliberately long headline that checks whether the layout stays readable when real writing gets in the way",
  },
};
export const SourceOnly: Story = { args: { publisher: undefined, updated: undefined, href: undefined } };

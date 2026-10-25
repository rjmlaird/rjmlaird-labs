import type { Meta, StoryObj } from "@storybook/react-vite";
import { DatasetMetadata } from "./DatasetMetadata";

const meta = {
  title: "Components/DatasetMetadata",
  component: DatasetMetadata,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: "Maturity: **Experimental**. Keep inside the sandbox." } } },
  args: {
    source: "CAMS European regional forecasts",
    coverage: "Europe, hourly, 0\u2013500 m levels",
    licence: "CC BY 4.0",
    processing: "Interpolated to Leicester grid cell",
  },
} satisfies Meta<typeof DatasetMetadata>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Typical: Story = {};
export const MissingData: Story = { args: { coverage: undefined, licence: undefined, processing: undefined } };
export const LongSource: Story = {
  args: {
    source:
      "A deliberately long headline that checks whether the layout stays readable when real writing gets in the way",
  },
};

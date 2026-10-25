import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChartFrame } from "./ChartFrame";

const meta = {
  title: "Components/ChartFrame",
  component: ChartFrame,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: "Maturity: **Experimental**. Text alternative, data table, source and method link are required." } } },
  args: {
    title: "PM2.5 by height",
    description: "Concentration falls from 12 to 7 micrograms per cubic metre between ground level and 300 metres.",
    data: [12, 11, 10, 9, 8, 7.5, 7].map((value, i) => ({ label: `${i * 50} m`, value })),
    xHeader: "Height",
    yHeader: "PM2.5 (\u00b5g/m\u00b3)",
    caption: "PM2.5 (\u00b5g/m\u00b3) from ground to 300 m.",
    source: "CAMS",
    methodHref: "#",
  },
} satisfies Meta<typeof ChartFrame>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Typical: Story = {};
export const LongCaption: Story = {
  args: {
    caption:
      "A deliberately long headline that checks whether the layout stays readable when real writing gets in the way.",
  },
};
export const NoData: Story = { args: { data: [] } };

import type { Meta, StoryObj } from "@storybook/react-vite";
import { Notice } from "./Notice";

const meta = {
  title: "Components/Notice",
  component: Notice,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: "Maturity: **Stable**. Four tones; every notice has a heading." } } },
  args: { heading: "Note", children: "The next update is due on the hour." },
} satisfies Meta<typeof Notice>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {};
export const Warn: Story = { args: { tone: "warn", heading: "Provisional data" } };
export const Danger: Story = { args: { tone: "danger", heading: "Could not load" } };
export const Success: Story = { args: { tone: "success", heading: "Published" } };

export const LongText: Story = {
  args: {
    children:
      "A deliberately long headline that checks whether the layout stays readable when real writing gets in the way. A deliberately long headline that checks whether the layout stays readable when real writing gets in the way.",
  },
};

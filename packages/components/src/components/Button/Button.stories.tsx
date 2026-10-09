import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";

const meta = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: "Maturity: **Stable**. Actions use buttons; navigation uses links." } } },
  args: { children: "Save changes" },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Secondary: Story = { args: { variant: "secondary", children: "Cancel" } };
export const Danger: Story = { args: { variant: "danger", children: "Delete draft" } };
export const Disabled: Story = { args: { disabled: true, children: "Saving" } };

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: ".6rem", alignItems: "center" }}>
      <Button>Save changes</Button>
      <Button variant="secondary">Cancel</Button>
      <Button variant="danger">Delete draft</Button>
      <Button disabled>Saving</Button>
    </div>
  ),
};

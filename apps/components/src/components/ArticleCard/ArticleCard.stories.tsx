import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArticleCard } from "./ArticleCard";

const meta = {
  title: "Components/ArticleCard",
  component: ArticleCard,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: "Maturity: **Candidate**. API may change." } } },
  args: {
    title: "Air quality above Leicester, layer by layer",
    meta: "Earth observation, 6 min read",
    summary: "How model output and ground stations disagree, and what that means for local air.",
    tags: ["Copernicus", "AURN", "Leicester"],
    href: "#",
  },
} satisfies Meta<typeof ArticleCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Typical: Story = {};
export const LongTitle: Story = {
  args: {
    title:
      "A deliberately long headline that checks whether the layout stays readable when real writing gets in the way",
  },
};
export const MissingData: Story = {
  args: { title: "", meta: undefined, summary: undefined, tags: [], href: undefined },
};

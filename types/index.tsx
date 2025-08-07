import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export type UsageMetrics = {
  executionTime: string;
  totalTokensUsed: number;
};

import * as echarts from "echarts/core";
import { BarChart, LineChart, GaugeChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  MarkLineComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

// Registering only what the panel draws keeps echarts out of the full-bundle path.
echarts.use([
  BarChart,
  LineChart,
  GaugeChart,
  GridComponent,
  TooltipComponent,
  MarkLineComponent,
  CanvasRenderer,
]);

export { echarts };
